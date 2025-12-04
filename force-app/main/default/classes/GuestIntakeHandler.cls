global without sharing class GuestIntakeHandler implements Messaging.InAppMessagingFormHandler {

    global Messaging.InAppMessagingFormResponse processForm(Messaging.InAppMessagingFormInput input) {
        
        String fName = (String) input.formValues.get('FirstName');
        String lName = (String) input.formValues.get('LastName');
        String email = (String) input.formValues.get('Email');
        String phone = (String) input.formValues.get('Phone');
        
        Object bestTimeObj = input.formValues.get('BestTime');
        String bestTimeStr = (bestTimeObj != null) ? String.valueOf(bestTimeObj) : 'Not specified';

        Contact matchedContact;
        
        List<Contact> contacts = [
            SELECT Id 
            FROM Contact 
            WHERE (Email != null AND Email = :email) 
               OR (Phone != null AND (Phone = :phone OR MobilePhone = :phone))
            LIMIT 1
        ];
        
        if (!contacts.isEmpty()) {
            matchedContact = contacts[0];
        } else {
            // Create new contact if no match found
            matchedContact = new Contact(
                FirstName = fName, 
                LastName = lName, 
                Email = email, 
                Phone = phone
            );
            insert matchedContact;
        }

        Case newCase = new Case();
        newCase.ContactId = matchedContact.Id;
        newCase.Subject = 'Support Request, Follow-up Needed: ' + lName;
        newCase.Description = 'Customer requested contact at: ' + bestTimeStr;
        newCase.SuppliedEmail = email;
        newCase.SuppliedPhone = phone;
        newCase.Origin = 'Agent Chat';
        
        insert newCase;

        Messaging.InAppMessagingFormResponse response = new Messaging.InAppMessagingFormResponse();
        response.isSuccess = true;
        return response;
    }
}
