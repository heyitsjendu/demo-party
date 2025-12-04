public with sharing class RelatedRecordPathController {
    
    @AuraEnabled(cacheable=true)
    public static PathResult getRelatedRecordPath(
        String parentRecordId,
        String relatedObjectApiName,
        String lookupFieldApiName,
        String stageFieldApiName
    ) {
        PathResult result = new PathResult();
        
        try {
            // Validate inputs
            if (String.isBlank(parentRecordId) || 
                String.isBlank(relatedObjectApiName) || 
                String.isBlank(lookupFieldApiName) || 
                String.isBlank(stageFieldApiName)) {
                result.success = false;
                result.message = 'Missing required parameters';
                return result;
            }
            
            // Build dynamic SOQL query
            // ORDER BY CreatedDate DESC returns the most recently created record
            // You can change this to LastModifiedDate DESC, Name, or another field
            String query = 'SELECT Id, ' + stageFieldApiName + 
                          ' FROM ' + relatedObjectApiName + 
                          ' WHERE ' + lookupFieldApiName + ' = :parentRecordId ' +
                          'ORDER BY CreatedDate DESC ' +
                          'LIMIT 1';
            
            List<SObject> records = Database.query(query);
            
            if (records.isEmpty()) {
                result.success = false;
                result.message = 'No related record found';
                return result;
            }
            
            SObject relatedRecord = records[0];
            result.recordId = relatedRecord.Id;
            result.currentStage = (String)relatedRecord.get(stageFieldApiName);
            
            // Get picklist values
            result.picklistValues = getPicklistValues(relatedObjectApiName, stageFieldApiName);
            
            result.success = true;
            
        } catch (Exception e) {
            result.success = false;
            result.message = 'Error: ' + e.getMessage();
        }
        
        return result;
    }
    
    private static List<PicklistValue> getPicklistValues(String objectApiName, String fieldApiName) {
        List<PicklistValue> picklistValues = new List<PicklistValue>();
        
        try {
            Schema.SObjectType objectType = Schema.getGlobalDescribe().get(objectApiName);
            if (objectType == null) {
                return picklistValues;
            }
            
            Schema.DescribeSObjectResult objectDescribe = objectType.getDescribe();
            Schema.DescribeFieldResult fieldDescribe = objectDescribe.fields.getMap().get(fieldApiName).getDescribe();
            
            for (Schema.PicklistEntry entry : fieldDescribe.getPicklistValues()) {
                if (entry.isActive()) {
                    PicklistValue pv = new PicklistValue();
                    pv.label = entry.getLabel();
                    pv.value = entry.getValue();
                    picklistValues.add(pv);
                }
            }
        } catch (Exception e) {
            System.debug('Error getting picklist values: ' + e.getMessage());
        }
        
        return picklistValues;
    }
    
    public class PathResult {
        @AuraEnabled public Boolean success;
        @AuraEnabled public String message;
        @AuraEnabled public String recordId;
        @AuraEnabled public String currentStage;
        @AuraEnabled public List<PicklistValue> picklistValues;
        
        public PathResult() {
            this.success = false;
            this.picklistValues = new List<PicklistValue>();
        }
    }
    
    public class PicklistValue {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
    }
}