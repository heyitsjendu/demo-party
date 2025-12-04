public class OutcomeReportPDFController {
    
    public String outcomeId { get; set; }
    public List<OutcomeData> outcomes { get; set; }
    
    public OutcomeReportPDFController() {
        outcomeId = ApexPages.currentPage().getParameters().get('outcomeId');
        loadData();
    }
    
    private void loadData() {
        outcomes = new List<OutcomeData>();
        
        if (String.isBlank(outcomeId)) {
            return;
        }
        
        // Query the Outcome record
        List<Outcome__c> outcomeRecords = [
            SELECT Id, Name, Description__c, Account__c, Account__r.Name, CreatedDate
            FROM Outcome__c
            WHERE Id = :outcomeId
            LIMIT 1
        ];
        
        if (outcomeRecords.isEmpty()) {
            return;
        }
        
        Outcome__c outcome = outcomeRecords[0];
        
        // Query Action Steps related to this Outcome
        List<Action_Step__c> actionSteps = [
            SELECT Id, Name, Description__c, Frequency__c, Methodology__c
            FROM Action_Step__c
            WHERE Outcome__c = :outcomeId
            ORDER BY Name
        ];
        
        if (actionSteps.isEmpty()) {
            return;
        }
        
        // Get all Action Step Ids
        Set<Id> actionStepIds = new Set<Id>();
        for (Action_Step__c step : actionSteps) {
            actionStepIds.add(step.Id);
        }
        
        // Query Action Step Instances
        List<Action_Step_Instance__c> instances = [
            SELECT Id, Action_Step__c, Code__c, Day_of_Month__c
            FROM Action_Step_Instance__c
            WHERE Action_Step__c IN :actionStepIds
            ORDER BY Day_of_Month__c
        ];
        
        // Organize data into a map: ActionStepId -> (Day -> Code)
        Map<Id, Map<Integer, String>> actionStepDataMap = new Map<Id, Map<Integer, String>>();
        
        for (Action_Step_Instance__c instance : instances) {
            if (!actionStepDataMap.containsKey(instance.Action_Step__c)) {
                actionStepDataMap.put(instance.Action_Step__c, new Map<Integer, String>());
            }
            
            Integer day = instance.Day_of_Month__c != null ? 
                          Integer.valueOf(instance.Day_of_Month__c) : null;
            
            if (day != null) {
                actionStepDataMap.get(instance.Action_Step__c).put(day, instance.Code__c);
            }
        }
        
        // Build the OutcomeData structure
        OutcomeData outcomeData = new OutcomeData();
        outcomeData.outcomeName = outcome.Name;
        outcomeData.outcomeDescription = outcome.Description__c;
        outcomeData.accountName = outcome.Account__r.Name;
        outcomeData.createdDate = outcome.CreatedDate;
        outcomeData.rows = new List<ActionStepRow>();
        
        // Create a row for each Action Step
        for (Action_Step__c step : actionSteps) {
            ActionStepRow row = new ActionStepRow();
            row.actionStepName = step.Name;
            row.description = step.Description__c;
            row.frequency = step.Frequency__c;
            row.methodology = step.Methodology__c;
            row.dayCodes = new List<String>();
            
            Map<Integer, String> dayCodeMap = actionStepDataMap.get(step.Id);
            
            // Fill in codes for days 1-31
            for (Integer day = 1; day <= 31; day++) {
                String code = '';
                if (dayCodeMap != null && dayCodeMap.containsKey(day)) {
                    code = dayCodeMap.get(day) != null ? dayCodeMap.get(day) : '';
                }
                row.dayCodes.add(code);
            }
            
            outcomeData.rows.add(row);
        }
        
        outcomes.add(outcomeData);
    }
    
    /**
     * Wrapper class for Outcome data
     */
    public class OutcomeData {
        public String outcomeName { get; set; }
        public String outcomeDescription { get; set; }
        public String accountName { get; set; }
        public DateTime createdDate { get; set; }
        public List<ActionStepRow> rows { get; set; }
    }
    
    /**
     * Wrapper class for Action Step row data
     */
    public class ActionStepRow {
        public String actionStepName { get; set; }
        public String description { get; set; }
        public String frequency { get; set; }
        public String methodology { get; set; }
        public List<String> dayCodes { get; set; }
    }
}