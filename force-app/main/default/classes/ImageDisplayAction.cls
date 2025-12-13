public class ImageDisplayAction {
    
    @InvocableMethod(label='Display Image' description='Shows image from Files by name')
    public static List<ImageResult> displayImage(List<ImageRequest> requests) {
        List<ImageResult> results = new List<ImageResult>();
        
        for (ImageRequest request : requests) {
            ImageResult result = new ImageResult();
            
            try {
                // Query for the file by name
                List<ContentDocument> docs = [
                    SELECT Id, Title 
                    FROM ContentDocument 
                    WHERE Title = :request.fileName 
                    LIMIT 1
                ];
                
                if (!docs.isEmpty()) {
                    // Get the public download URL
                    String fileId = docs[0].Id;
                    String imageUrl = '/sfc/servlet.shepherd/document/download/' + fileId;
                    result.imageMarkdown = '![' + request.altText + '](' + imageUrl + ')';
                    result.success = true;
                } else {
                    result.imageMarkdown = 'Image "' + request.fileName + '" not found';
                    result.success = false;
                }
            } catch (Exception e) {
                result.imageMarkdown = 'Error loading image: ' + e.getMessage();
                result.success = false;
            }
            
            results.add(result);
        }
        
        return results;
    }
    
    public class ImageRequest {
        @InvocableVariable(required=true label='File Name')
        public String fileName;
        
        @InvocableVariable(label='Alt Text')
        public String altText = 'Screenshot';
    }
    
    public class ImageResult {
        @InvocableVariable
        public String imageMarkdown;
        
        @InvocableVariable
        public Boolean success;
    }
}