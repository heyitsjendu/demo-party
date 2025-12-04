public class ContactInfo {
    @InvocableVariable(required=true)
    public String firstName;
    
    @InvocableVariable(required=true)
    public String lastName;
    
    @InvocableVariable(required=false)
    public String email;
    
    @InvocableVariable(required=false)
    public String phone;

    @InvocableVariable(required=false)
    public Date contactDate; 
}