public class SimilarContactFinder {
    
    public class SimilarityRequest {
        @InvocableVariable(required=true)
        public String accountId;
        
        @InvocableVariable(required=true)
        public String originalTitle;
        
        @InvocableVariable
        public String excludeContactId;
        
        @InvocableVariable
        public Integer maxResults = 5;
    }
    
    public class ScoredContact {
        @InvocableVariable
        public String contactId;
        
        @InvocableVariable
        public String contactName;
        
        @InvocableVariable
        public String title;
        
        @InvocableVariable
        public String email;
        
        @InvocableVariable
        public String phone;
        
        @InvocableVariable
        public Decimal similarityScore;
        
        @InvocableVariable
        public String reasoning;
    }
    
    @InvocableMethod(label='Find Similar Contacts by Title' 
                    description='Finds contacts with similar titles at the same account')
    public static List<ScoredContact> findSimilarContacts(List<SimilarityRequest> requests) {
        List<ScoredContact> results = new List<ScoredContact>();
        
        for (SimilarityRequest request : requests) {
            try {
                // Fix: Use variables instead of binding in dynamic query
                String accountId = request.accountId;
                String excludeContactId = request.excludeContactId;
                
                List<Contact> allContacts;
                
                if (String.isNotBlank(excludeContactId)) {
                    allContacts = [
                        SELECT Id, Name, Title, Email, Phone 
                        FROM Contact 
                        WHERE AccountId = :accountId 
                        AND Title != null 
                        AND Id != :excludeContactId
                    ];
                } else {
                    allContacts = [
                        SELECT Id, Name, Title, Email, Phone 
                        FROM Contact 
                        WHERE AccountId = :accountId 
                        AND Title != null
                    ];
                }
                
                System.debug('Found ' + allContacts.size() + ' contacts to compare');
                
                // Score each contact's title similarity
                List<ScoredContact> scoredContacts = new List<ScoredContact>();
                
                for (Contact contact : allContacts) {
                    ScoredContact scored = new ScoredContact();
                    scored.contactId = contact.Id;
                    scored.contactName = contact.Name;
                    scored.title = contact.Title;
                    scored.email = contact.Email;
                    scored.phone = contact.Phone;
                    
                    // Calculate similarity score
                    TitleSimilarity similarity = calculateTitleSimilarity(request.originalTitle, contact.Title);
                    scored.similarityScore = similarity.score;
                    scored.reasoning = similarity.reasoning;
                    
                    System.debug('Comparing "' + request.originalTitle + '" vs "' + contact.Title + '" = ' + similarity.score + ' (' + similarity.reasoning + ')');
                    
                    if (scored.similarityScore > 0) {
                        scoredContacts.add(scored);
                    }
                }
                
                // Sort by similarity score (highest first)
                scoredContacts.sort(new SimilarityComparator());
                
                // Return top results
                Integer maxResults = request.maxResults != null ? request.maxResults : 5;
                for (Integer i = 0; i < Math.min(scoredContacts.size(), maxResults); i++) {
                    results.add(scoredContacts[i]);
                }
                
            } catch (Exception e) {
                ScoredContact errorResult = new ScoredContact();
                errorResult.reasoning = 'Error finding similar contacts: ' + e.getMessage();
                System.debug('ERROR: ' + e.getMessage());
                results.add(errorResult);
            }
        }
        
        return results;
    }
    
    // Helper class for similarity calculation
    public class TitleSimilarity {
        public Decimal score;
        public String reasoning;
    }
    
    private static TitleSimilarity calculateTitleSimilarity(String originalTitle, String compareTitle) {
        TitleSimilarity result = new TitleSimilarity();
        result.score = 0;
        List<String> reasons = new List<String>();
        
        if (String.isBlank(originalTitle) || String.isBlank(compareTitle)) {
            result.reasoning = 'One or both titles are blank';
            return result;
        }
        
        String orig = originalTitle.toLowerCase().replaceAll('[^a-z0-9\\s]', ' ').replaceAll('\\s+', ' ').trim();
        String comp = compareTitle.toLowerCase().replaceAll('[^a-z0-9\\s]', ' ').replaceAll('\\s+', ' ').trim();
        
        System.debug('Normalized titles: "' + orig + '" vs "' + comp + '"');
        
        // Exact match
        if (orig.equals(comp)) {
            result.score = 100;
            result.reasoning = 'Exact title match';
            return result;
        }
        
        // Define key terms and their weights - IMPROVED
        Map<String, Integer> seniorityTerms = new Map<String, Integer>{
            'ceo' => 100, 'chief executive' => 100, 'president' => 95, 
            'vp' => 90, 'vice president' => 90, 'svp' => 95, 'senior vice president' => 95,
            'director' => 80, 'senior director' => 85, 
            'senior manager' => 70, 'manager' => 60,
            'senior' => 50, 'lead' => 45, 'coordinator' => 40, 'specialist' => 35,
            'associate' => 30, 'assistant' => 25, 'intern' => 10
        };
        
        Set<String> departmentTerms = new Set<String>{
            'clinical', 'operations', 'sales', 'marketing', 'finance', 'hr', 'human resources',
            'it', 'technology', 'engineering', 'product', 'customer', 'support', 'legal',
            'compliance', 'quality', 'research', 'development', 'business'
        };
        
        // Check for seniority level matches
        Integer origSeniority = 0;
        Integer compSeniority = 0;
        String origSeniorityTerm = '';
        String compSeniorityTerm = '';
        
        for (String term : seniorityTerms.keySet()) {
            if (orig.contains(term)) {
                if (seniorityTerms.get(term) > origSeniority) {
                    origSeniority = seniorityTerms.get(term);
                    origSeniorityTerm = term;
                }
            }
            if (comp.contains(term)) {
                if (seniorityTerms.get(term) > compSeniority) {
                    compSeniority = seniorityTerms.get(term);
                    compSeniorityTerm = term;
                }
            }
        }
        
        // Check for department matches
        Set<String> origDepts = new Set<String>();
        Set<String> compDepts = new Set<String>();
        
        for (String dept : departmentTerms) {
            if (orig.contains(dept)) {
                origDepts.add(dept);
            }
            if (comp.contains(dept)) {
                compDepts.add(dept);
            }
        }
        
        Set<String> commonDepts = new Set<String>(origDepts);
        commonDepts.retainAll(compDepts);
        
        // Calculate base similarity
        if (!commonDepts.isEmpty()) {
            result.score += 40; // Base score for same department
            reasons.add('Same department: ' + String.join(new List<String>(commonDepts), ', '));
        }
        
        // Seniority scoring - IMPROVED
        if (origSeniority > 0 && compSeniority > 0) {
            Integer seniorityDiff = Math.abs(origSeniority - compSeniority);
            if (seniorityDiff == 0) {
                result.score += 40; // Same seniority level
                reasons.add('Same seniority level (' + origSeniorityTerm + ')');
            } else if (seniorityDiff <= 10) {
                result.score += 30; // Similar seniority
                reasons.add('Similar seniority (' + origSeniorityTerm + ' vs ' + compSeniorityTerm + ')');
            } else if (seniorityDiff <= 20) {
                result.score += 20; // Somewhat similar seniority
                reasons.add('Related seniority (' + origSeniorityTerm + ' vs ' + compSeniorityTerm + ')');
            }
        }
        
        // Word overlap bonus
        Set<String> origWords = new Set<String>(orig.split('\\s+'));
        Set<String> compWords = new Set<String>(comp.split('\\s+'));
        
        // Remove common words that don't add meaning
        Set<String> stopWords = new Set<String>{'of', 'and', 'the', 'for', 'in', 'at', 'to'};
        origWords.removeAll(stopWords);
        compWords.removeAll(stopWords);
        
        Set<String> commonWords = new Set<String>(origWords);
        commonWords.retainAll(compWords);
        
        if (commonWords.size() > 0) {
            result.score += (commonWords.size() * 5); // 5 points per common word
            reasons.add(commonWords.size() + ' common words: ' + String.join(new List<String>(commonWords), ', '));
        }
        
        result.reasoning = reasons.isEmpty()? 'No significant similarities found' : String.join(reasons, '; ');
        return result;
    }
    
    // Comparator for sorting by similarity score
    public class SimilarityComparator implements Comparator<ScoredContact> {
        public Integer compare(ScoredContact a, ScoredContact b) {
            if (a.similarityScore > b.similarityScore) return -1;
            if (a.similarityScore < b.similarityScore) return 1;
            return 0;
        }
    }
}