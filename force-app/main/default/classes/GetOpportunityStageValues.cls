public class GetOpportunityStageValues {
    
    @InvocableMethod(label='Get Opportunity Stage Values' 
                     description='Returns valid Stage Name values for a specific Opportunity Record Type'
                     category='Opportunity')
    public static List<Response> getStageValues(List<Request> requests) {
        List<Response> responses = new List<Response>();
        
        for (Request req : requests) {
            Response res = new Response();
            res.stageNames = new List<String>();
            
            try {
                // Get the Record Type ID if Developer Name is provided
                String recordTypeId = req.recordTypeId;
                if (String.isBlank(recordTypeId) && String.isNotBlank(req.recordTypeDeveloperName)) {
                    RecordType rt = [SELECT Id 
                                   FROM RecordType 
                                   WHERE DeveloperName = :req.recordTypeDeveloperName 
                                   AND SobjectType = 'Opportunity' 
                                   LIMIT 1];
                    recordTypeId = rt.Id;
                }
                
                // Get picklist values
                Schema.DescribeFieldResult fieldResult = Opportunity.StageName.getDescribe();
                List<Schema.PicklistEntry> allEntries = fieldResult.getPicklistValues();
                
                // If Record Type is specified, verify it exists
                if (String.isNotBlank(recordTypeId)) {
                    Schema.DescribeSObjectResult oppDescribe = Opportunity.SObjectType.getDescribe();
                    Map<Id, Schema.RecordTypeInfo> recordTypeInfoMap = oppDescribe.getRecordTypeInfosById();
                    
                    if (recordTypeInfoMap.containsKey(recordTypeId)) {
                        // Get all active picklist values
                        for (Schema.PicklistEntry entry : allEntries) {
                            if (entry.isActive()) {
                                res.stageNames.add(entry.getLabel());
                            }
                        }
                    }
                } else {
                    // No record type specified - return all active values
                    for (Schema.PicklistEntry entry : allEntries) {
                        if (entry.isActive()) {
                            res.stageNames.add(entry.getLabel());
                        }
                    }
                }
                
                res.success = true;
                res.errorMessage = '';
                
            } catch (Exception e) {
                res.success = false;
                res.errorMessage = e.getMessage();
            }
            
            responses.add(res);
        }
        
        return responses;
    }
    
    public class Request {
        @InvocableVariable(label='Record Type ID' 
                          description='The ID of the Opportunity Record Type (optional)')
        public String recordTypeId;
        
        @InvocableVariable(label='Record Type Developer Name' 
                          description='The Developer Name of the Opportunity Record Type (optional)')
        public String recordTypeDeveloperName;
    }
    
    public class Response {
        @InvocableVariable(label='Stage Names' 
                          description='List of valid Stage Name values')
        public List<String> stageNames;
        
        @InvocableVariable(label='Success' 
                          description='Whether the operation was successful')
        public Boolean success;
        
        @InvocableVariable(label='Error Message' 
                          description='Error message if operation failed')
        public String errorMessage;
    }
}