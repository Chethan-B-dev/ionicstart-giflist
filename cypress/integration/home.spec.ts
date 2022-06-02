import { getListItems, getVideo, navigateToHomePage } from '../support/utils';

describe('Home', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/.json?limit=100', {
      fixture: 'reddit.json',
    });
    navigateToHomePage();
  });

  it('displays a list with items', () => {
    getListItems().should('have.length.above', 0);
  });

  it('should be able to play videos', () => {
    getVideo()
      .first()
      .then((element) => {
        element.on('playing', cy.stub().as('playing'));
      });

    getListItems().first().click();

    cy.get('@playing').should('have.been.called');
  });
});
