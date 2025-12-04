public class CustomerContactActions {
    public class Request {
        @InvocableVariable(required=true)
        public CustomerContactForm form;
    }

    public class Result {
        @InvocableVariable
        public Id caseId; // or whatever you return
    }

    @InvocableMethod(label='Handle Customer Contact Form')
    public static List<Result> handle(List<Request> requests) {

        return new List<Result>();
    }
}