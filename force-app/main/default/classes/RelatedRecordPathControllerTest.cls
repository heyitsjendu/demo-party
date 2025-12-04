@isTest
private class RelatedRecordPathControllerTest {
    
    @TestSetup
    static void setupTestData() {
        // Create test Account
        Account testAccount = new Account(
            Name = 'Test Account'
        );
        insert testAccount;
        
        // Create test Clinical Service Request
        // Note: Adjust field names based on your actual object structure
        ClinicalServiceRequest testCSR = new ClinicalServiceRequest(
            PatientId = testAccount.Id,
            Status = 'New' // Adjust to match your picklist values
        );
        insert testCSR;
    }
    
    @isTest
    static void testGetRelatedRecordPath_Success() {
        // Get test data
        Account testAccount = [SELECT Id FROM Account LIMIT 1];
        ClinicalServiceRequest testCSR = [SELECT Id, Status FROM ClinicalServiceRequest LIMIT 1];
        
        Test.startTest();
        RelatedRecordPathController.PathResult result = 
            RelatedRecordPathController.getRelatedRecordPath(
                testAccount.Id,
                'ClinicalServiceRequest',
                'PatientId',
                'Status'
            );
        Test.stopTest();
        
        System.assertEquals(true, result.success, 'Query should succeed');
        System.assertEquals(testCSR.Id, result.recordId, 'Should return correct record ID');
        System.assertEquals(testCSR.Status, result.currentStage, 'Should return current stage');
        System.assertNotEquals(null, result.picklistValues, 'Should return picklist values');
        System.assert(result.picklistValues.size() > 0, 'Should have at least one picklist value');
    }
    
    @isTest
    static void testGetRelatedRecordPath_NoRelatedRecord() {
        // Create account with no related CSR
        Account testAccount = new Account(Name = 'Test Account 2');
        insert testAccount;
        
        Test.startTest();
        RelatedRecordPathController.PathResult result = 
            RelatedRecordPathController.getRelatedRecordPath(
                testAccount.Id,
                'ClinicalServiceRequest',
                'PatientId',
                'Status'
            );
        Test.stopTest();
        
        System.assertEquals(false, result.success, 'Query should fail when no related record exists');
        System.assertEquals('No related record found', result.message, 'Should return appropriate message');
    }
    
    @isTest
    static void testGetRelatedRecordPath_MissingParameters() {
        Test.startTest();
        RelatedRecordPathController.PathResult result = 
            RelatedRecordPathController.getRelatedRecordPath(
                null,
                'ClinicalServiceRequest',
                'PatientId',
                'Status'
            );
        Test.stopTest();
        
        System.assertEquals(false, result.success, 'Should fail with missing parameters');
        System.assertEquals('Missing required parameters', result.message, 'Should return appropriate message');
    }
    
    @isTest
    static void testGetRelatedRecordPath_InvalidObjectName() {
        Account testAccount = [SELECT Id FROM Account LIMIT 1];
        
        Test.startTest();
        RelatedRecordPathController.PathResult result = 
            RelatedRecordPathController.getRelatedRecordPath(
                testAccount.Id,
                'Invalid_Object__c',
                'PatientId',
                'Status'
            );
        Test.stopTest();
        
        System.assertEquals(false, result.success, 'Should fail with invalid object name');
        System.assert(result.message.contains('Error'), 'Should return error message');
    }
}