public class MismatchAnalysisActions {
    
    public class MismatchRequest {
        @InvocableVariable(label='Days to Analyze' description='Number of days back to analyze (default 365)')
        public Integer daysToAnalyze;
    }
    
    public class MismatchResult {
        @InvocableVariable(required=true)
        public String fieldName;
        
        @InvocableVariable(required=true)
        public Integer mismatchCount;
    }
    
    public class MismatchResponse {
        @InvocableVariable(required=true)
        public List<MismatchResult> results;
        
        @InvocableVariable
        public Integer totalRecordsAnalyzed;
        
        @InvocableVariable
        public Integer daysAnalyzed;
    }
    
    @InvocableMethod(
        label='Get Field Mismatch Counts' 
        description='Counts how many times each audit field has a Mismatch value'
        category='Audit Analysis'
    )
    public static List<MismatchResponse> getMismatchCounts(List<MismatchRequest> requests) {
        
        // Default to 365 days if not specified
        Integer daysBack = 365;
        if (requests != null && !requests.isEmpty() && requests[0].daysToAnalyze != null) {
            daysBack = requests[0].daysToAnalyze;
        }
        
        // Query all Audit records within the date range
        String query = 'SELECT BillRate__c, MaxAuthAmount__c, Units__c, ' +
                       'ExpirationDate__c, StartDate__c ' +
                       'FROM Audit__c ' +
                       'WHERE CreatedDate = LAST_N_DAYS:' + daysBack;
        
        List<Audit__c> audits = Database.query(query);
        
        // Initialize counters
        Map<String, Integer> mismatchCounts = new Map<String, Integer>{
            'BillRate' => 0,
            'MaxAuthAmount' => 0,
            'Units' => 0,
            'ExpirationDate' => 0,
            'StartDate' => 0
        };
        
        // Count mismatches for each field
        for (Audit__c audit : audits) {
            if (audit.BillRate__c == 'Mismatch') {
                mismatchCounts.put('BillRate', mismatchCounts.get('BillRate') + 1);
            }
            if (audit.MaxAuthAmount__c == 'Mismatch') {
                mismatchCounts.put('MaxAuthAmount', mismatchCounts.get('MaxAuthAmount') + 1);
            }
            if (audit.Units__c == 'Mismatch') {
                mismatchCounts.put('Units', mismatchCounts.get('Units') + 1);
            }
            if (audit.ExpirationDate__c == 'Mismatch') {
                mismatchCounts.put('ExpirationDate', mismatchCounts.get('ExpirationDate') + 1);
            }
            if (audit.StartDate__c == 'Mismatch') {
                mismatchCounts.put('StartDate', mismatchCounts.get('StartDate') + 1);
            }
        }
        
        // Build response
        MismatchResponse response = new MismatchResponse();
        response.results = new List<MismatchResult>();
        response.totalRecordsAnalyzed = audits.size();
        response.daysAnalyzed = daysBack;
        
        for (String fieldName : mismatchCounts.keySet()) {
            MismatchResult result = new MismatchResult();
            result.fieldName = fieldName;
            result.mismatchCount = mismatchCounts.get(fieldName);
            response.results.add(result);
        }
        
        return new List<MismatchResponse>{ response };
    }
}