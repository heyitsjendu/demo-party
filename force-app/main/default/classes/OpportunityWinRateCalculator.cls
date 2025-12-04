public class OpportunityWinRateCalculator {
    
    @InvocableMethod(label='Calculate Win Rate for Recent Opportunities')
    public static List<WinRateResult> calculateWinRates(List<InputWrapper> inputs) {
        
        Date thirtyDaysAgo = Date.today().addDays(-30);
        
        List<Opportunity> recentOpps = [
            SELECT Id, OwnerId, Owner.Name, StageName, IsWon, IsClosed
              FROM Opportunity 
             WHERE CreatedDate >= :thirtyDaysAgo
        ];
        
        Map<Id, Integer> ownerTotal = new Map<Id, Integer>();
        Map<Id, Integer> ownerWon   = new Map<Id, Integer>();
        Map<Id, String> ownerNames  = new Map<Id, String>();
        
        Integer companyTotal = 0;
        Integer companyWon   = 0;
        
        for (Opportunity opp : recentOpps) {
            companyTotal++;
            if (opp.IsWon) {
                companyWon++;
            }
            
            ownerNames.put(opp.OwnerId, opp.Owner.Name);
            
            if (ownerTotal.containsKey(opp.OwnerId)) {
                ownerTotal.put(opp.OwnerId, ownerTotal.get(opp.OwnerId) + 1);
            } else {
                ownerTotal.put(opp.OwnerId, 1);
            }
            
            if (ownerWon.containsKey(opp.OwnerId)) {
                Integer currentWon = ownerWon.get(opp.OwnerId);
                ownerWon.put(opp.OwnerId, opp.IsWon ? currentWon + 1 : currentWon);
            } else {
                ownerWon.put(opp.OwnerId, opp.IsWon ? 1 : 0);
            }
        }
        
        String repSummary = '';
        Decimal highestRate = 0;
        String topPerformer = '';
        Decimal lowestRate = 100;
        String lowestPerformer = '';
        
        for (Id ownerId : ownerNames.keySet()) {
            Integer total = ownerTotal.get(ownerId);
            Integer won = ownerWon.get(ownerId);
            Decimal rate = total > 0 ? (won * 100.0) / total : 0;
            
            repSummary += ownerNames.get(ownerId) + ': ' + won + '/' + total + ' opportunities (' + rate.setScale(1) + '%), ';
            
            if (rate > highestRate) {
                highestRate = rate;
                topPerformer = ownerNames.get(ownerId);
            }
            if (rate < lowestRate) {
                lowestRate = rate;
                lowestPerformer = ownerNames.get(ownerId);
            }
        }
        
        WinRateResult result = new WinRateResult();
        result.ownerName = 'Win Rate Report';
        result.totalOpportunities = companyTotal;
        result.wonOpportunities = companyWon;
        result.winRate = companyTotal > 0 ? (companyWon * 100.0) / companyTotal : 0;
        result.repBreakdown = repSummary;
        result.topPerformer = topPerformer + ' (' + highestRate.setScale(1) + '%)';
        result.lowestPerformer = lowestPerformer + ' (' + lowestRate.setScale(1) + '%)';
        
        List<WinRateResult> results = new List<WinRateResult>();
        results.add(result);
        return results;
    }
    
    public class InputWrapper {
        @InvocableVariable(label='Request')
        public String requestText;
    }
    
    public class WinRateResult {
        @InvocableVariable
        public String ownerName;
        @InvocableVariable
        public Integer totalOpportunities;
        @InvocableVariable
        public Integer wonOpportunities;
        @InvocableVariable
        public Decimal winRate;
        @InvocableVariable
        public String repBreakdown;
        @InvocableVariable
        public String topPerformer;
        @InvocableVariable
        public String lowestPerformer;
        
        public WinRateResult() {
            this.totalOpportunities = 0;
            this.wonOpportunities = 0;
            this.winRate = 0;
        }
    }
}