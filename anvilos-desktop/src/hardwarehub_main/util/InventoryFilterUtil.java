package hardwarehub_main.util;

import hardwarehub_main.model.Product;
import hardwarehub_main.model.Category;
import java.util.*;

public class InventoryFilterUtil {
    // Levenshtein distance for fuzzy matching
    public static int levenshtein(String a, String b) {
        int[] costs = new int[b.length() + 1];
        for (int j = 0; j < costs.length; j++) costs[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            costs[0] = i;
            int nw = i - 1;
            for (int j = 1; j <= b.length(); j++) {
                int cj = Math.min(1 + Math.min(costs[j], costs[j - 1]), a.charAt(i - 1) == b.charAt(j - 1) ? nw : nw + 1);
                nw = costs[j];
                costs[j] = cj;
            }
        }
        return costs[b.length()];
    }

    public static List<Product> filterProducts(List<Product> allProducts, String searchText, String supplierFilter,
                                               boolean lowStock, boolean noStock, boolean availableOnly, boolean unavailableOnly,
                                               boolean fastMoving, boolean multiSupplier, Set<String> selectedCategories, Set<String> selectedSuppliers) {
        String text = searchText != null ? searchText.trim().toLowerCase() : "";
        String[] fastMovingKeywords = {"fastener", "screw", "nail", "tool", "paint", "pipe", "electric", "accessory"};
        List<Product> list = new ArrayList<>(allProducts);
        Set<Integer> multiSupplierIndexes = null;
        if (multiSupplier) {
            // Fuzzy grouping: group products by similar names (substring or Levenshtein)
            List<String> normalizedNames = new ArrayList<>();
            for (Product p : list) normalizedNames.add(p.getProductName().trim().toLowerCase());
            List<Set<Integer>> groups = new ArrayList<>();
            boolean[] grouped = new boolean[list.size()];
            for (int i = 0; i < list.size(); i++) {
                if (grouped[i]) continue;
                Set<Integer> group = new HashSet<>();
                group.add(i);
                grouped[i] = true;
                String nameA = normalizedNames.get(i);
                for (int j = i + 1; j < list.size(); j++) {
                    if (grouped[j]) continue;
                    String nameB = normalizedNames.get(j);
                    boolean similar = false;
                    // Substring match (at least 5 chars)
                    if (nameA.length() >= 5 && nameB.length() >= 5 && (nameA.contains(nameB) || nameB.contains(nameA))) {
                        similar = true;
                    } else {
                        // Levenshtein threshold
                        int threshold = (Math.max(nameA.length(), nameB.length()) <= 10) ? 2 : 3;
                        if (levenshtein(nameA, nameB) <= threshold) similar = true;
                    }
                    if (similar) {
                        group.add(j);
                        grouped[j] = true;
                    }
                }
                groups.add(group);
            }
            // For each group, check if there are multiple unique suppliers
            multiSupplierIndexes = new HashSet<>();
            for (Set<Integer> group : groups) {
                Set<String> suppliers = new HashSet<>();
                for (int idx : group) suppliers.add(list.get(idx).getSupplierName());
                if (suppliers.size() > 1) {
                    multiSupplierIndexes.addAll(group);
                }
            }
        }
        List<Product> filtered = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            Product p = list.get(i);
            boolean matches = p.getProductName().toLowerCase().contains(text);
            if (supplierFilter != null && !supplierFilter.equals("All Suppliers") && !supplierFilter.isEmpty()) {
                matches = matches && p.getSupplierName().equals(supplierFilter);
            }
            if (lowStock) {
                matches = matches && (p.getQuantity() <= p.getMinThreshold() && p.getQuantity() > 0);
            }
            if (noStock) {
                matches = matches && (p.getQuantity() == 0);
            }
            if (availableOnly) {
                matches = matches && p.isAvailable();
            }
            if (unavailableOnly) {
                matches = matches && !p.isAvailable();
            }
            if (fastMoving) {
                Category child = hardwarehub_main.dao.CategoryDAO.getCategoryById(p.getCategoryId());
                String catName = (child != null) ? child.getCategory().toLowerCase() : p.getCategory().toLowerCase();
                boolean isFast = false;
                for (String kw : fastMovingKeywords) {
                    if (catName.contains(kw)) { isFast = true; break; }
                }
                matches = matches && isFast;
            }
            if (multiSupplier) {
                matches = matches && (multiSupplierIndexes != null && multiSupplierIndexes.contains(i));
            }
            if (selectedCategories != null && !selectedCategories.isEmpty()) {
                Category child = hardwarehub_main.dao.CategoryDAO.getCategoryById(p.getCategoryId());
                String catName = (child != null) ? child.getCategory() : p.getCategory();
                matches = matches && selectedCategories.contains(catName);
            }
            if (selectedSuppliers != null && !selectedSuppliers.isEmpty()) {
                matches = matches && selectedSuppliers.contains(p.getSupplierName());
            }
            if (matches) {
                filtered.add(p);
            }
        }
        return filtered;
    }
} 