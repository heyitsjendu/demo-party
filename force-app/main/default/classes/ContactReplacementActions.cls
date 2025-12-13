public class ContactReplacementActions {
    
    public class ContactRequest {
        @InvocableVariable(required=true)
        public String contactName;
        
        @InvocableVariable(required=true)
        public String accountName;
    }
    
    public class ContactResult {
        @InvocableVariable
        public String contactId;
        
        @InvocableVariable
        public String contactName;
        
        @InvocableVariable
        public String title;
        
        @InvocableVariable
        public String accountId;
        
        @InvocableVariable
        public String accountName;
        
        @InvocableVariable
        public String email;
        
        @InvocableVariable
        public String phone;
        
        @InvocableVariable
        public String errorMessage;
    }
    
    @InvocableMethod(label='Get Contact Details by Name and Account' 
                    description='Finds a contact by name and account, returns their details')
    public static List<ContactResult> getContactDetails(List<ContactRequest> requests) {
        List<ContactResult> results = new List<ContactResult>();
        
        for (ContactRequest request : requests) {
            ContactResult result = new ContactResult();
            
            try {
                List<Contact> contacts = [
                    SELECT Id, Name, Title, Email, Phone, Account.Id, Account.Name
                    FROM Contact 
                    WHERE Name LIKE :('%' + request.contactName + '%')
                    AND Account.Name LIKE :('%' + request.accountName + '%')
                    LIMIT 10
                ];
                
                if (contacts.isEmpty()) {
                    result.errorMessage = 'No contact found with name "' + request.contactName + 
                                        '" at account "' + request.accountName + '"';
                } else {
                    Contact foundContact = contacts[0];
                    
                    result.contactId = foundContact.Id;
                    result.contactName = foundContact.Name;
                    result.title = foundContact.Title;
                    result.accountId = foundContact.Account.Id;
                    result.accountName = foundContact.Account.Name;
                    result.email = foundContact.Email;
                    result.phone = foundContact.Phone;
                }
                
            } catch (Exception e) {
                result.errorMessage = 'Error finding contact: ' + e.getMessage();
            }
            
            results.add(result);
        }
        
        return results;
    }
}