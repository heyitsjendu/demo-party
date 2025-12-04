public class RecordRefreshPublisher {
    public static void publishRefreshEvent(Id recordId, String objectName) {
        Record_Refresh__e event = new Record_Refresh__e(
            Record_Id__c = recordId,
            Object_Name__c = objectName
        );
        
        EventBus.publish(event);
    }
}