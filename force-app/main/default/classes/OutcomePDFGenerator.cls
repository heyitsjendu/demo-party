public class OutcomePDFGenerator {
    
    /**
     * Invocable method for Agentforce to generate PDF for Outcome records
     */
    @InvocableMethod(label='Generate Outcome PDF' 
                     description='Generates a PDF report for Outcome records with Action Steps and Instances'
                     category='Document Generation')
    public static List<Result> generateOutcomePDF(List<Request> requests) {
        List<Result> results = new List<Result>();
        
        for (Request req : requests) {
            Result result = new Result();
            
            try {
                // Query Outcome to get Account Name and Created Date for filename
                Outcome__c outcome = [
                    SELECT Id, Account__c, Account__r.Name, CreatedDate 
                    FROM Outcome__c 
                    WHERE Id = :req.outcomeId 
                    LIMIT 1
                ];
                
                // Format the date for filename (MM-dd-yyyy)
                String formattedDate = outcome.CreatedDate.format('MM-dd-yyyy');
                
                // Create filename: "Outcomes Report - AccountName, MM-dd-yyyy"
                String accountName = outcome.Account__r.Name != null ? outcome.Account__r.Name : 'Unknown';
                String fileName = 'Outcomes Report - ' + accountName + ', ' + formattedDate;
                
                // Generate the PDF
                PageReference pdfPage = Page.OutcomeReportPDF;
                pdfPage.getParameters().put('outcomeId', req.outcomeId);
                
                Blob pdfBlob;
                if (Test.isRunningTest()) {
                    // In test context, we can't generate actual PDFs
                    pdfBlob = Blob.valueOf('Test PDF Content');
                } else {
                    pdfBlob = pdfPage.getContentAsPDF();
                }
                
                // Create ContentVersion to store the PDF
                ContentVersion cv = new ContentVersion();
                cv.Title = fileName;
                cv.PathOnClient = fileName + '.pdf';
                cv.VersionData = pdfBlob;
                cv.FirstPublishLocationId = req.outcomeId;  // Attach to Outcome first
                cv.IsMajorVersion = true;
                
                insert cv;
                
                // Get the ContentDocument Id
                ContentVersion insertedCV = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id LIMIT 1];
                
                // Share the PDF with the Account record (if Account exists)
                if (outcome.Account__c != null) {
                    ContentDocumentLink cdl = new ContentDocumentLink();
                    cdl.ContentDocumentId = insertedCV.ContentDocumentId;
                    cdl.LinkedEntityId = outcome.Account__c;  // Link to Account
                    cdl.ShareType = 'V';  // V = Viewer, C = Collaborator, I = Inferred
                    cdl.Visibility = 'AllUsers';  // AllUsers, InternalUsers, or SharedUsers
                    
                    insert cdl;
                }
                
                result.success = true;
                result.contentDocumentId = insertedCV.ContentDocumentId;
                result.message = 'PDF generated successfully: ' + fileName;
                
            } catch (Exception e) {
                result.success = false;
                result.message = 'Error generating PDF: ' + e.getMessage();
                System.debug('Error in generateOutcomePDF: ' + e.getMessage() + '\n' + e.getStackTraceString());
            }
            
            results.add(result);
        }
        
        return results;
    }
    
    /**
     * Input parameters for the invocable method
     */
    public class Request {
        @InvocableVariable(label='Outcome Record Id' required=true)
        public String outcomeId;
    }
    
    /**
     * Output parameters for the invocable method
     */
    public class Result {
        @InvocableVariable(label='Success')
        public Boolean success;
        
        @InvocableVariable(label='Content Document Id')
        public String contentDocumentId;
        
        @InvocableVariable(label='Message')
        public String message;
    }
}