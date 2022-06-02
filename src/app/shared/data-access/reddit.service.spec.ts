/* eslint-disable @typescript-eslint/naming-convention */
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  HttpClientTestingModule,
} from '@angular/common/http/testing';
import { SubscriberSpy, subscribeSpyTo } from '@hirez_io/observer-spy';
import { Gif } from '../interfaces/gif';
import { RedditPost } from '../interfaces/reddit-post';
import { RedditResponse } from '../interfaces/reddit-response';

import { RedditService } from './reddit.service';

describe('RedditService', () => {
  let service: RedditService;
  let httpMock: HttpTestingController;

  let getGifsSpy: SubscriberSpy<Gif[]>;
  let testResponse: RedditResponse;
  const api = `https://www.reddit.com/r/gifs/hot/.json?limit=100`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(RedditService);
    httpMock = TestBed.inject(HttpTestingController);
    getGifsSpy = subscribeSpyTo(service.getGifs());

    const testData: RedditPost = {
      data: {
        author: 'Josh',
        name: 'some cool post',
        permalink: 'https://google.com',
        preview: {
          reddit_video_preview: {
            is_gif: true,
            fallback_url: '',
          },
        },
        secure_media: {
          reddit_video: {
            is_gif: true,
            fallback_url: '',
          },
        },
        title: 'some cool post',
        media: {
          reddit_video: {
            is_gif: true,
            fallback_url: '',
          },
        },
        url: '',
        thumbnail: '',
        num_comments: 5,
      },
    };

    testResponse = {
      data: {
        children: [testData, testData],
      },
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getGifs()', () => {
    it('should return a stream of an array', () => {
      expect(getGifsSpy.getLastValue()).toBeInstanceOf(Array);
    });
  });

  describe('loadGifs()', () => {
    it('should cause new data to emit on getGifs() stream', () => {
      service.loadGifs();

      const mockReq = httpMock.expectOne(api);
      mockReq.flush(testResponse);

      expect(getGifsSpy.getLastValue()?.length).toBeGreaterThan(0);
    });

    it('should add additional data to getGifs() array every time it is called', () => {
      service.loadGifs();

      const mockReq = httpMock.expectOne(api);
      mockReq.flush(testResponse);

      service.loadGifs();

      const mockReqTwo = httpMock.expectOne(api);
      mockReqTwo.flush(testResponse);

      const sizeBefore = getGifsSpy.getValueAt(
        getGifsSpy.getValuesLength() - 2
      ).length;
      const sizeAfter = getGifsSpy.getLastValue()?.length;

      expect(sizeAfter).toBeGreaterThan(sizeBefore);
    });

    it('should filter out any gifs that do not have a useable src property', () => {
      testResponse.data.children[0].data.secure_media = null as any;
      testResponse.data.children[0].data.media.reddit_video = null as any;
      testResponse.data.children[0].data.preview = null as any;

      const lengthWithNoPostFiltered = testResponse.data.children.length;

      service.loadGifs();

      const mockReq = httpMock.expectOne(api);
      mockReq.flush(testResponse);

      const result = getGifsSpy.getLastValue();

      expect(result?.length).toBeLessThan(lengthWithNoPostFiltered);
    });

    it('should convert src to mp4 format if the post is in .gifv format', () => {
      testResponse.data.children[0].data.url = 'https://test.com/test.gifv';

      service.loadGifs();

      const mockReq = httpMock.expectOne(api);
      mockReq.flush(testResponse);

      const result = getGifsSpy.getLastValue();

      expect(
        result?.find((gif) => gif.src === 'https://test.com/test.mp4')
      ).toBeTruthy();
    });

    it('should convert src to mp4 format if the post is in .webm format', () => {
      testResponse.data.children[0].data.url = 'https://test.com/test.webm';

      service.loadGifs();

      const mockReq = httpMock.expectOne(api);
      mockReq.flush(testResponse);

      const result = getGifsSpy.getLastValue();

      expect(
        result?.find((gif) => gif.src === 'https://test.com/test.mp4')
      ).toBeTruthy();
    });

    it('should convert src to secure media if available, if gifv or webm not available', () => {
      testResponse.data.children[0].data.secure_media.reddit_video.fallback_url =
        'test';

      service.loadGifs();

      const mockReq = httpMock.expectOne(api);
      mockReq.flush(testResponse);

      const result = getGifsSpy.getLastValue();

      expect(result?.find((gif) => gif.src === 'test')).toBeTruthy();
    });

    it('should convert src to media if available and none of the above available', () => {
      testResponse.data.children[0].data.secure_media = null as any;
      testResponse.data.children[0].data.media.reddit_video.fallback_url =
        'test';

      service.loadGifs();

      const mockReq = httpMock.expectOne(api);
      mockReq.flush(testResponse);

      const result = getGifsSpy.getLastValue();

      expect(result?.find((gif) => gif.src === 'test')).toBeTruthy();
    });

    it('should convert src to fallback url of preview if no media objects are available', () => {
      testResponse.data.children[0].data.secure_media = null as any;
      testResponse.data.children[0].data.media.reddit_video = null as any;
      testResponse.data.children[0].data.preview.reddit_video_preview = {
        fallback_url: 'test',
      } as any;

      service.loadGifs();

      const mockReq = httpMock.expectOne(api);
      mockReq.flush(testResponse);

      const result = getGifsSpy.getLastValue();

      expect(result?.find((gif) => gif.src === 'test')).toBeTruthy();
    });
  });
});
