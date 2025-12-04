public class CustomerContactForm {
    @InvocableVariable(required=true)
    public String firstName;

    @InvocableVariable(required=true)
    public String lastName;

    @InvocableVariable(required=true)
    public String email;

    @InvocableVariable(required=true)
    public String phone;

    @InvocableVariable(required=true)
    public String bestTimeToContact;
}