describe('Todo App', () => {
    it('should visit the home page', () => {
        cy.visit('http://localhost:3000');
      cy.contains('Todo App');
    });
  
    it('should add a new todo', () => {
     cy.visit('http://localhost:3000');
      cy.contains('Add New Todo').click();
  
      cy.get('input[placeholder="Enter todo title"]').type('New Todo');
      cy.get('textarea[placeholder="Enter todo description"]').type('Description of the new todo');
      cy.contains('Add Todo').click();
  
      cy.contains('New Todo').should('be.visible');
    });
  
    it('should edit an existing todo', () => {
     cy.visit('http://localhost:3000');
      cy.contains('Edit').click();
  
      cy.get('input[placeholder="Enter todo title"]').clear().type('Updated Todo');
      cy.get('textarea[placeholder="Enter todo description"]').clear().type('Updated Description');
      cy.contains('Update Todo').click();
  
      cy.contains('Updated Todo').should('be.visible');
    });
  
    it('should delete a todo', () => {
     cy.visit('http://localhost:3000');
      cy.contains('Delete').click();
  
      cy.contains('Test Todo').should('not.exist');
    });
  });
  