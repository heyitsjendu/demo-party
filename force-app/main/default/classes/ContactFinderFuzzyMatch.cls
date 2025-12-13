public class ContactFinderFuzzyMatch {

    public class ContactRequest {
        @InvocableVariable(required=true)
        public String contactName;
        
        @InvocableVariable(required=true)
        public String accountName;
    }
    
    public class ContactMatch {
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
        public Decimal matchScore;
        
        @InvocableVariable
        public String errorMessage;
    }
    
    @InvocableMethod(label='Find Contact with Fuzzy Matching' 
                    description='Finds contacts using fuzzy name and account matching')
    public static List<ContactMatch> findContact(List<ContactRequest> requests) {
        List<ContactMatch> results = new List<ContactMatch>();
        
        for (ContactRequest request : requests) {
            ContactMatch result = new ContactMatch();
            
            try {
                // Step 1: Clean and prepare search terms
                String cleanContactName = cleanName(request.contactName);
                String cleanAcctName = cleanAccountName(request.accountName);
                
                // Step 2: Try multiple search strategies
                List<Contact> candidates = new List<Contact>();
                
                // Strategy 1: SOSL search (best for fuzzy matching)
                try {
                    String soslSearchTerm = String.escapeSingleQuotes(request.contactName);
                    String sosl = 'FIND {' + soslSearchTerm + '} ' +
                                 'IN NAME FIELDS ' +
                                 'RETURNING Contact(Id, Name, Title, Email, Account.Id, Account.Name ' +
                                 'WHERE Account.Name != null) ' +
                                 'LIMIT 20';

                    List<List<SObject>> soslResults = Search.query(sosl);
                    if (!soslResults.isEmpty() && !soslResults[0].isEmpty()) {
                        for (SObject obj : soslResults[0]) {
                            Contact c = (Contact)obj;
                            if (c.Account != null && c.Account.Name != null &&
                                c.Account.Name.containsIgnoreCase(request.accountName)) {
                                candidates.add(c);
                            }
                        }
                    }
                } catch (Exception soslEx) {
                    // SOSL might fail, continue to fallback strategies
                }
                
                // Strategy 2: Direct SOQL with LIKE (fallback)
                if (candidates.isEmpty()) {
                    candidates = [
                        SELECT Id, Name, Title, Email, Account.Id, Account.Name
                        FROM Contact
                        WHERE (Name LIKE :('%' + request.contactName + '%')
                               OR Name LIKE :('%' + cleanContactName + '%'))
                        AND (Account.Name LIKE :('%' + request.accountName + '%')
                             OR Account.Name LIKE :('%' + cleanAcctName + '%'))
                        WITH SECURITY_ENFORCED
                        LIMIT 10
                    ];
                }
                
                // Strategy 3: Split name search (handle "First Last" vs "Last, First")
                if (candidates.isEmpty() && request.contactName.contains(' ')) {
                    List<String> nameParts = request.contactName.split(' ');
                    String firstPart = nameParts[0];
                    String lastPart = nameParts[nameParts.size() - 1];

                    candidates = [
                        SELECT Id, Name, Title, Email, Account.Id, Account.Name
                        FROM Contact
                        WHERE ((Name LIKE :('%' + firstPart + '%') AND Name LIKE :('%' + lastPart + '%'))
                               OR (Name LIKE :(lastPart + '%') AND Name LIKE :('%' + firstPart + '%')))
                        AND Account.Name LIKE :('%' + request.accountName + '%')
                        WITH SECURITY_ENFORCED
                        LIMIT 5
                    ];
                }
                
                if (candidates.isEmpty()) {
                    result.errorMessage = 'No contact found matching "' + request.contactName + 
                                        '" at "' + request.accountName + '"';
                } else {
                    // Step 3: Score the candidates and find best match
                    ContactMatch bestMatch = scoreCandidates(candidates, request.contactName, request.accountName);
                    
                    result.contactId = bestMatch.contactId;
                    result.contactName = bestMatch.contactName;
                    result.title = bestMatch.title;
                    result.accountId = bestMatch.accountId;
                    result.accountName = bestMatch.accountName;
                    result.matchScore = bestMatch.matchScore;
                    
                    if (result.matchScore < 0.5) {
                        result.errorMessage = 'Found possible matches but confidence is low. ' +
                                            'Best match: ' + result.contactName + ' (' + result.matchScore + '% confidence)';
                    }
                }
                
            } catch (Exception e) {
                result.errorMessage = 'Search error: ' + e.getMessage();
            }
            
            results.add(result);
        }
        
        return results;
    }
    
    // Helper method to score candidates
    private static ContactMatch scoreCandidates(List<Contact> candidates, String searchName, String searchAccount) {
        ContactMatch bestMatch = new ContactMatch();
        Decimal bestScore = 0;

        // Clean search terms once upfront
        String cleanSearchName = cleanName(searchName);
        String cleanSearchAccount = cleanAccountName(searchAccount);

        for (Contact candidate : candidates) {
            // Skip if Account is null
            if (candidate.Account == null) continue;

            Decimal nameScore = calculateNameSimilarityOptimized(searchName, candidate.Name, cleanSearchName);
            Decimal accountScore = calculateAccountSimilarityOptimized(searchAccount, candidate.Account.Name, cleanSearchAccount);
            Decimal totalScore = (nameScore * 0.7) + (accountScore * 0.3); // Weight name more heavily

            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestMatch.contactId = candidate.Id;
                bestMatch.contactName = candidate.Name;
                bestMatch.title = candidate.Title;
                bestMatch.accountId = candidate.Account.Id;
                bestMatch.accountName = candidate.Account.Name;
                bestMatch.matchScore = totalScore;

                // Early exit if perfect match
                if (totalScore >= 1.0) break;
            }
        }

        return bestMatch;
    }
    
    // Optimized version that accepts pre-cleaned search term
    private static Decimal calculateNameSimilarityOptimized(String search, String actual, String cleanedSearch) {
        if (String.isBlank(search) || String.isBlank(actual)) return 0;

        String actualLower = cleanName(actual);

        // Exact match
        if (cleanedSearch.equals(actualLower)) return 1.0;

        // Contains match
        if (actualLower.contains(cleanedSearch) || cleanedSearch.contains(actualLower)) {
            return 0.8;
        }

        // Word overlap
        Set<String> searchWords = new Set<String>(cleanedSearch.split('\\s+'));
        Set<String> actualWords = new Set<String>(actualLower.split('\\s+'));
        Set<String> intersection = new Set<String>(searchWords);
        intersection.retainAll(actualWords);

        if (!intersection.isEmpty()) {
            return Decimal.valueOf(intersection.size()) / Math.max(searchWords.size(), actualWords.size());
        }

        return 0;
    }

    // Helper method to calculate name similarity
    private static Decimal calculateNameSimilarity(String search, String actual) {
        String cleanedSearch = cleanName(search);
        return calculateNameSimilarityOptimized(search, actual, cleanedSearch);
    }
    
    // Optimized version that accepts pre-cleaned search term
    private static Decimal calculateAccountSimilarityOptimized(String search, String actual, String cleanedSearch) {
        if (String.isBlank(search) || String.isBlank(actual)) return 0;

        String actualLower = cleanAccountName(actual);

        // Exact match
        if (cleanedSearch.equals(actualLower)) return 1.0;

        // Contains match
        if (actualLower.contains(cleanedSearch) || cleanedSearch.contains(actualLower)) {
            return 0.9;
        }

        // Significant word overlap
        Set<String> searchWords = new Set<String>(cleanedSearch.split('\\s+'));
        Set<String> actualWords = new Set<String>(actualLower.split('\\s+'));

        // Remove common business words
        Set<String> commonWords = new Set<String>{'inc', 'llc', 'corp', 'corporation', 'company', 'co', 'ltd', 'limited'};
        searchWords.removeAll(commonWords);
        actualWords.removeAll(commonWords);

        Set<String> intersection = new Set<String>(searchWords);
        intersection.retainAll(actualWords);

        if (!intersection.isEmpty() && !searchWords.isEmpty()) {
            return Decimal.valueOf(intersection.size()) / searchWords.size() * 0.8;
        }

        return 0;
    }

    // Helper method to calculate account similarity
    private static Decimal calculateAccountSimilarity(String search, String actual) {
        String cleanedSearch = cleanAccountName(search);
        return calculateAccountSimilarityOptimized(search, actual, cleanedSearch);
    }
    
    // Helper method to clean names
    private static String cleanName(String name) {
        if (String.isBlank(name)) return '';
        return name.toLowerCase()
                  .replaceAll('[^a-z\\s]', ' ') // Remove punctuation
                  .replaceAll('\\s+', ' ')      // Normalize spaces
                  .trim();
    }
    
    // Helper method to clean account names
    private static String cleanAccountName(String accountName) {
        if (String.isBlank(accountName)) return '';
        return accountName.toLowerCase()
                         .replaceAll('[^a-z0-9\\s]', ' ') // Keep numbers for account names
                         .replaceAll('\\s+', ' ')
                         .trim();
    }
}