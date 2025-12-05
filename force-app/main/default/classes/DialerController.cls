public with sharing class DialerController {
    
    @AuraEnabled(cacheable=false)
    public static Map<String, String> getRecordInfo(String recordId) {
        Map<String, String> result = new Map<String, String>();
        
        try {
            String objectType = recordId.substring(0, 3);
            
            if (objectType == '003') {
                Contact c = [SELECT Name, Phone, MobilePhone 
                            FROM Contact 
                            WHERE Id = :recordId 
                            LIMIT 1];
                result.put('name', c.Name);
                result.put('phone', String.isNotBlank(c.Phone) ? c.Phone : c.MobilePhone);
                result.put('type', 'Contact');
            } else if (objectType == '00Q') {
                Lead l = [SELECT Name, Phone, MobilePhone 
                         FROM Lead 
                         WHERE Id = :recordId 
                         LIMIT 1];
                result.put('name', l.Name);
                result.put('phone', String.isNotBlank(l.Phone) ? l.Phone : l.MobilePhone);
                result.put('type', 'Lead');
            }
            
            return result;
        } catch (Exception e) {
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static String saveCallLog(String whoId, String contactName, String phoneNumber, 
                                     String duration, String notes) {
        try {
            Task newTask = new Task(
                Subject = 'Call with ' + contactName,
                WhoId = whoId,
                Description = 'Phone: ' + phoneNumber + '\nDuration: ' + duration + '\n\nNotes:\n' + notes,
                Status = 'Completed',
                TaskSubtype = 'Call',
                Type = 'Call',
                ActivityDate = Date.today()
            );
            
            insert newTask;
            
            return newTask.Id;
        } catch (Exception e) {
            throw new AuraHandledException('Error saving call: ' + e.getMessage());
        }
    }
}