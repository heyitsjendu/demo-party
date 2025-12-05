public with sharing class PDFFillerController {
    
    @AuraEnabled
    public static String attachPdfAndCreateEnvelope(String opportunityId, String pdfBase64, String fileName) {
        try {
            // Get Opportunity and Account info
            Opportunity opp = [SELECT Id, AccountId, Name FROM Opportunity WHERE Id = :opportunityId LIMIT 1];
            
            if (opp.AccountId == null) {
                throw new AuraHandledException('Opportunity must have an associated Account');
            }
            
            // Step 1: Create ContentVersion (file) and attach to Opportunity
            ContentVersion cv = new ContentVersion();
            cv.Title = fileName;
            cv.PathOnClient = fileName;
            cv.VersionData = EncodingUtil.base64Decode(pdfBase64);
            cv.FirstPublishLocationId = opportunityId;
            cv.IsMajorVersion = true;
            insert cv;
            
            // Get ContentDocumentId
            ContentVersion insertedCV = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id LIMIT 1];
            String contentDocumentId = insertedCV.ContentDocumentId;
            
            // Step 2: Create Envelope record
            dfsle__Envelope__c envelope = new dfsle__Envelope__c();
            envelope.dfsle__Sent__c = System.now();
            envelope.dfsle__EmailSubject__c = 'Purchase Agreement for your DocuSign Signature';
            insert envelope;
            
            System.debug('*** Envelope created: ' + envelope.Id);
            
            // Step 3: Attach PDF to Envelope
            ContentDocumentLink cdl = new ContentDocumentLink();
            cdl.ContentDocumentId = contentDocumentId;
            cdl.LinkedEntityId = envelope.Id;
            cdl.ShareType = 'V';
            cdl.Visibility = 'AllUsers';
            insert cdl;
            
            // Step 4: Create EnvelopeStatus record WITHOUT DocuSignId first
            dfsle__EnvelopeStatus__c envelopeStatus = new dfsle__EnvelopeStatus__c();
            envelopeStatus.dfsle__Sent__c = System.now();
            envelopeStatus.dfsle__Status__c = 'Sent';
            envelopeStatus.dfsle__Account__c = opp.AccountId;
            envelopeStatus.dfsle__Opportunity__c = opportunityId;
            
            insert envelopeStatus;
            System.debug('*** EnvelopeStatus created: ' + envelopeStatus.Id);
            
            // Step 5: NOW update the DocuSignId in a separate transaction
            envelopeStatus.dfsle__DocuSignId__c = envelope.Id;
            update envelopeStatus;
            
            System.debug('*** EnvelopeStatus updated with DocuSignId');
            
            // Verify what was saved
            dfsle__EnvelopeStatus__c savedStatus = [
                SELECT Id, dfsle__DocuSignId__c, Name, dfsle__Sent__c 
                FROM dfsle__EnvelopeStatus__c 
                WHERE Id = :envelopeStatus.Id 
                LIMIT 1
            ];
            System.debug('*** Final DocuSignId value: ' + savedStatus.dfsle__DocuSignId__c);
            
            return JSON.serialize(new Map<String, String>{
                'success' => 'true',
                'envelopeId' => envelope.Id,
                'envelopeStatusId' => envelopeStatus.Id,
                'docuSignId' => savedStatus.dfsle__DocuSignId__c,
                'message' => 'PDF attached and DocuSign envelope created successfully'
            });
            
        } catch (Exception e) {
            System.debug('*** ERROR: ' + e.getMessage());
            System.debug('*** Stack Trace: ' + e.getStackTraceString());
            throw new AuraHandledException('Error: ' + e.getMessage() + ' | Line: ' + e.getLineNumber());
        }
    }
}