public with sharing class UserLeadSelectorController {

    @AuraEnabled(cacheable=true)
    public static List<User> getUsers() {
        try {
            return [
                SELECT Id, Name, Email, SmallPhotoUrl
                FROM User
                WHERE UserRoleId = '00EKY000001Lwdr2AC'
                ORDER BY Name
                LIMIT 5
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving users: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Lead> getLeads() {
        try {
            return [
                SELECT Id, Name, Company, CreatedDate, Status, License_State__c
                FROM Lead
                WHERE IsConverted = false
                AND ExcludeFromNew__c = false
                AND LeadSource = 'New Customer Form'
                ORDER BY Name
                LIMIT 30
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving leads: ' + e.getMessage());
        }
    }
}