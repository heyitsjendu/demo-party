public with sharing class PdfFillerController {
    
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
            envelope.Name = 'Purchase Agreement - ' + opp.Name;
            insert envelope;
            
            // Step 3: Attach PDF to Envelope
            ContentDocumentLink cdl = new ContentDocumentLink();
            cdl.ContentDocumentId = contentDocumentId;
            cdl.LinkedEntityId = envelope.Id;
            cdl.ShareType = 'V'; // Viewer permission
            cdl.Visibility = 'AllUsers';
            insert cdl;
            
            // Step 4: Create EnvelopeStatus record
            dfsle__EnvelopeStatus__c envelopeStatus = new dfsle__EnvelopeStatus__c();
            envelopeStatus.dfsle__DocuSignId__c = envelope.Name;
            envelopeStatus.dfsle__Sent__c = System.now();
            envelopeStatus.Name = 'Sent';
            envelopeStatus.dfsle__Account__c = opp.AccountId;
            envelopeStatus.dfsle__Opportunity__c = opportunityId;
            insert envelopeStatus;
            
            return JSON.serialize(new Map<String, String>{
                'success' => 'true',
                'envelopeId' => envelope.Id,
                'message' => 'PDF attached and DocuSign envelope created successfully'
            });
            
        } catch (Exception e) {
            throw new AuraHandledException('Error: ' + e.getMessage() + ' | Line: ' + e.getLineNumber());
        }
    }
}