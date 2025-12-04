@isTest
private class OutcomePDFGeneratorTest {
    
    @testSetup
    static void setupTestData() {
        // Create test Outcome
        Outcome__c outcome = new Outcome__c(
            Name = 'Test Outcome 001',
            Description__c = 'RSS will assist me in becoming more independent'
        );
        insert outcome;
        
        // Create test Action Steps
        List<Action_Step__c> actionSteps = new List<Action_Step__c>();
        for (Integer i = 1; i <= 4; i++) {
            actionSteps.add(new Action_Step__c(
                Name = 'Action Step 00000' + i,
                Outcome__c = outcome.Id
            ));
        }
        insert actionSteps;
        
        // Create test Action Step Instances
        List<Action_Step_Instance__c> instances = new List<Action_Step_Instance__c>();
        for (Action_Step__c step : actionSteps) {
            for (Integer day = 1; day <= 31; day++) {
                instances.add(new Action_Step_Instance__c(
                    Action_Step__c = step.Id,
                    Day_of_Month__c = day,
                    Code__c = getTestCode(day)
                ));
            }
        }
        insert instances;
    }
    
    private static String getTestCode(Integer day) {
        List<String> codes = new List<String>{'x', 'as', 'jk', 'dc'};
        return codes[Math.mod(day, codes.size())];
    }
    
    @isTest
    static void testGenerateOutcomePDF() {
        // Get test outcome
        Outcome__c outcome = [SELECT Id FROM Outcome__c LIMIT 1];
        
        // Prepare request
        OutcomePDFGenerator.Request request = new OutcomePDFGenerator.Request();
        request.outcomeId = outcome.Id;
        
        List<OutcomePDFGenerator.Request> requests = new List<OutcomePDFGenerator.Request>{request};
        
        Test.startTest();
        List<OutcomePDFGenerator.Result> results = OutcomePDFGenerator.generateOutcomePDF(requests);
        Test.stopTest();
        
        // Verify results
        System.assertEquals(1, results.size(), 'Should return one result');
        System.assertEquals(true, results[0].success, 'PDF generation should succeed');
        System.assertNotEquals(null, results[0].contentDocumentId, 'Should have ContentDocument Id');
        
        // Verify ContentVersion was created
        List<ContentVersion> cvList = [
            SELECT Id, Title, PathOnClient 
            FROM ContentVersion 
            WHERE FirstPublishLocationId = :outcome.Id
        ];
        System.assertEquals(1, cvList.size(), 'Should create one ContentVersion');
        System.assert(cvList[0].Title.contains('Outcome Report'), 'Title should contain Outcome Report');
    }
    
    @isTest
    static void testGenerateOutcomePDF_InvalidId() {
        // Test with invalid ID
        OutcomePDFGenerator.Request request = new OutcomePDFGenerator.Request();
        request.outcomeId = 'invalid_id';
        
        List<OutcomePDFGenerator.Request> requests = new List<OutcomePDFGenerator.Request>{request};
        
        Test.startTest();
        List<OutcomePDFGenerator.Result> results = OutcomePDFGenerator.generateOutcomePDF(requests);
        Test.stopTest();
        
        // Verify error handling
        System.assertEquals(1, results.size(), 'Should return one result');
        System.assertEquals(false, results[0].success, 'Should fail with invalid ID');
        System.assert(results[0].message.contains('Error'), 'Should contain error message');
    }
    
    @isTest
    static void testOutcomeReportPDFController() {
        // Get test outcome
        Outcome__c outcome = [SELECT Id FROM Outcome__c LIMIT 1];
        
        // Set page parameters
        PageReference pageRef = Page.OutcomeReportPDF;
        pageRef.getParameters().put('outcomeId', outcome.Id);
        Test.setCurrentPage(pageRef);
        
        Test.startTest();
        OutcomeReportPDFController controller = new OutcomeReportPDFController();
        Test.stopTest();
        
        // Verify data was loaded
        System.assertNotEquals(null, controller.outcomes, 'Outcomes should not be null');
        System.assertEquals(1, controller.outcomes.size(), 'Should have one outcome');
        System.assertEquals(4, controller.outcomes[0].rows.size(), 'Should have 4 action step rows');
        
        // Verify day codes
        for (OutcomeReportPDFController.ActionStepRow row : controller.outcomes[0].rows) {
            System.assertEquals(31, row.dayCodes.size(), 'Each row should have 31 day codes');
        }
    }
    
    @isTest
    static void testOutcomeReportPDFController_NoOutcomeId() {
        // Test without outcome ID
        PageReference pageRef = Page.OutcomeReportPDF;
        Test.setCurrentPage(pageRef);
        
        Test.startTest();
        OutcomeReportPDFController controller = new OutcomeReportPDFController();
        Test.stopTest();
        
        // Verify empty results
        System.assertNotEquals(null, controller.outcomes, 'Outcomes should not be null');
        System.assertEquals(0, controller.outcomes.size(), 'Should have no outcomes without ID');
    }
}
