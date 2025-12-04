public class ContactActionHandler {
    @InvocableMethod(label='Collect Contact Info')
    public static List<String> collectContactInfo(List<ContactInfo> contacts) {
        // Process the contact information
        ContactInfo contact = contacts[0];
        // Your logic here
        return new List<String>{'Contact information received successfully'};
    }
}