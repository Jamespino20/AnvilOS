package hardwarehub_main.gui.auditlog;

import hardwarehub_main.model.AuditLog;
import hardwarehub_main.util.IconUtil;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.opencsv.CSVWriter;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.*;
import java.util.stream.Collectors;
import com.toedter.calendar.JDateChooser;
import hardwarehub_main.util.DialogUtils;

public class ExportAuditLogsDialog extends JDialog {
    private JTextField tfFile;
    private JButton btnBrowse, btnExportCsv, btnExportXlsx, btnExportPdf, btnCancel;
    private JComboBox<String> cbFormat;
    private JFileChooser fileChooser;
    private JRadioButton rbAll, rbCurrent, rbCustom;
    private ButtonGroup exportGroup;
    private JPanel customPanel;
    private JDateChooser calFrom, calTo;
    private JComboBox<String> cbType, cbSortOrder;
    private JTextField tfSearch;
    private List<AuditLog> allLogs;
    private List<AuditLog> currentTableLogs;
    private static final String[] COLUMNS = {"Time", "Panel", "Action", "Details"};
    private static final java.text.SimpleDateFormat EXPORT_DATE_FORMAT = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public ExportAuditLogsDialog(Window owner, List<AuditLog> allLogs, List<AuditLog> currentTableLogs) {
        super(owner, "Export Audit Logs", ModalityType.APPLICATION_MODAL);
        this.allLogs = allLogs;
        this.currentTableLogs = currentTableLogs;
        setLayout(new BorderLayout(10, 10));
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);
        setSize(600, 420);
        setLocationRelativeTo(owner);
        setIconImage(IconUtil.loadIcon("HardwareHub_Icon.png").getImage());
        DialogUtils.bindEscapeKeyToClose(this);

        // Mode panel
        JPanel modePanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        modePanel.setBorder(BorderFactory.createTitledBorder("Export Mode"));
        rbAll = new JRadioButton("All Audit Logs");
        rbCurrent = new JRadioButton("Current Table View");
        rbCustom = new JRadioButton("Custom Filter");
        exportGroup = new ButtonGroup();
        exportGroup.add(rbAll); exportGroup.add(rbCurrent); exportGroup.add(rbCustom);
        rbCurrent.setSelected(true);
        modePanel.add(rbAll); modePanel.add(rbCurrent); modePanel.add(rbCustom);
        add(modePanel, BorderLayout.NORTH);

        // Custom filter panel
        customPanel = new JPanel(new GridBagLayout());
        customPanel.setBorder(BorderFactory.createTitledBorder("Custom Filter"));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(5, 5, 5, 5);
        gbc.anchor = GridBagConstraints.WEST;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.gridx = 0; gbc.gridy = 0;
        customPanel.add(new JLabel("Type:"), gbc);
        gbc.gridx = 1;
        cbType = new JComboBox<>(new String[]{"All", "Login", "Process", "Stock"});
        customPanel.add(cbType, gbc);
        gbc.gridx = 0; gbc.gridy = 1;
        customPanel.add(new JLabel("Search:"), gbc);
        gbc.gridx = 1;
        tfSearch = new JTextField(18);
        customPanel.add(tfSearch, gbc);
        gbc.gridx = 0; gbc.gridy = 2;
        customPanel.add(new JLabel("Date from:"), gbc);
        gbc.gridx = 1;
        calFrom = new JDateChooser();
        customPanel.add(calFrom, gbc);
        gbc.gridx = 2;
        customPanel.add(new JLabel("to"), gbc);
        gbc.gridx = 3;
        calTo = new JDateChooser();
        customPanel.add(calTo, gbc);
        gbc.gridx = 0; gbc.gridy = 3;
        customPanel.add(new JLabel("Sort:"), gbc);
        gbc.gridx = 1;
        cbSortOrder = new JComboBox<>(new String[]{"Descending", "Ascending"});
        customPanel.add(cbSortOrder, gbc);
        add(customPanel, BorderLayout.CENTER);
        customPanel.setVisible(false);

        // Mode listeners
        rbAll.addActionListener(e -> customPanel.setVisible(false));
        rbCurrent.addActionListener(e -> customPanel.setVisible(false));
        rbCustom.addActionListener(e -> customPanel.setVisible(true));

        // File panel
        JPanel filePanel = new JPanel(new GridBagLayout());
        filePanel.setBorder(BorderFactory.createTitledBorder("Export Options"));
        GridBagConstraints gbcFile = new GridBagConstraints();
        gbcFile.insets = new Insets(8, 8, 8, 8);
        gbcFile.anchor = GridBagConstraints.WEST;
        gbcFile.fill = GridBagConstraints.HORIZONTAL;
        gbcFile.gridx = 0; gbcFile.gridy = 0;
        filePanel.add(new JLabel("File:"), gbcFile);
        gbcFile.gridx = 1;
        tfFile = new JTextField(22);
        tfFile.setEditable(false);
        filePanel.add(tfFile, gbcFile);
        gbcFile.gridx = 2;
        btnBrowse = new JButton("Browse...");
        filePanel.add(btnBrowse, gbcFile);
        gbcFile.gridx = 0; gbcFile.gridy = 1;
        filePanel.add(new JLabel("Format:"), gbcFile);
        gbcFile.gridx = 1;
        cbFormat = new JComboBox<>(new String[] {"XLSX (Excel)", "CSV (Comma-separated)", "PDF (PDF Document)"});
        filePanel.add(cbFormat, gbcFile);
        add(filePanel, BorderLayout.SOUTH);

        // Set default export directory and file chooser
        String userHome = System.getProperty("user.home");
        Path exportDir = Paths.get(userHome, "Documents", "HardwareHub", "Exports", "Audit Logs");
        if (!Files.exists(exportDir)) try { Files.createDirectories(exportDir); } catch (Exception ex) {}
        fileChooser = new JFileChooser(exportDir.toFile());
        // Add file filters for each format
        fileChooser.resetChoosableFileFilters();
        fileChooser.addChoosableFileFilter(new javax.swing.filechooser.FileNameExtensionFilter("Excel Files (*.xlsx)", "xlsx"));
        fileChooser.addChoosableFileFilter(new javax.swing.filechooser.FileNameExtensionFilter("CSV Files (*.csv)", "csv"));
        fileChooser.addChoosableFileFilter(new javax.swing.filechooser.FileNameExtensionFilter("PDF Files (*.pdf)", "pdf"));
        fileChooser.setAcceptAllFileFilterUsed(true);
        String defaultFileName = "auditlogs_export_" + new SimpleDateFormat("yyyyMMdd").format(new Date());
        fileChooser.setSelectedFile(new File(fileChooser.getCurrentDirectory(), defaultFileName));
        tfFile.setText(fileChooser.getSelectedFile().getAbsolutePath());

        btnBrowse.addActionListener(e -> {
            String selectedFormat = (String) cbFormat.getSelectedItem();
            String extension = "xlsx";
            if (selectedFormat.startsWith("CSV")) extension = "csv";
            else if (selectedFormat.startsWith("PDF")) extension = "pdf";
            fileChooser.setSelectedFile(new File(fileChooser.getCurrentDirectory(), "auditlogs_" + new SimpleDateFormat("yyyyMMdd").format(new Date()) + "." + extension));
            // Set the file filter
            for (int i = 0; i < fileChooser.getChoosableFileFilters().length; i++) {
                javax.swing.filechooser.FileFilter filter = fileChooser.getChoosableFileFilters()[i];
                if (filter.getDescription().toLowerCase().contains(extension)) {
                    fileChooser.setFileFilter(filter);
                    break;
                }
            }
            int result = fileChooser.showSaveDialog(this);
            if (result == JFileChooser.APPROVE_OPTION) {
                File chosen = fileChooser.getSelectedFile();
                String path = chosen.getAbsolutePath();
                if (!path.toLowerCase().endsWith("." + extension)) {
                    path += "." + extension;
                }
                tfFile.setText(path);
            }
        });

        // Export buttons
        JPanel exportButtonsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        exportButtonsPanel.setBorder(BorderFactory.createTitledBorder("Export Format"));
        btnExportXlsx = new JButton("Export to XLSX");
        btnExportCsv = new JButton("Export to CSV");
        btnExportPdf = new JButton("Export to PDF");
        btnCancel = new JButton("Cancel");
        exportButtonsPanel.add(btnExportXlsx);
        exportButtonsPanel.add(btnExportCsv);
        exportButtonsPanel.add(btnExportPdf);
        exportButtonsPanel.add(btnCancel);
        add(exportButtonsPanel, BorderLayout.AFTER_LAST_LINE);

        btnExportXlsx.addActionListener(e -> exportWithChooser("XLSX"));
        btnExportCsv.addActionListener(e -> exportWithChooser("CSV"));
        btnExportPdf.addActionListener(e -> exportWithChooser("PDF"));
        btnCancel.addActionListener(e -> dispose());
    }

    private List<AuditLog> getExportLogs() {
        if (rbAll.isSelected()) {
            return allLogs;
        } else if (rbCurrent.isSelected()) {
            return currentTableLogs;
        } else {
            // Custom filter
            String type = (String) cbType.getSelectedItem();
            String search = tfSearch.getText().trim().toLowerCase();
            Date from = calFrom.getDate();
            Date to = calTo.getDate();
            boolean ascending = cbSortOrder.getSelectedItem().equals("Ascending");
            return allLogs.stream()
                .filter(log -> type.equals("All") || (log.getAction() != null && log.getAction().equalsIgnoreCase(type)))
                .filter(log -> search.isEmpty() || (log.getDetails() != null && log.getDetails().toLowerCase().contains(search)))
                .filter(log -> from == null || (log.getLogTime() != null && !log.getLogTime().toLocalDate().isBefore(new java.sql.Date(from.getTime()).toLocalDate())))
                .filter(log -> to == null || (log.getLogTime() != null && !log.getLogTime().toLocalDate().isAfter(new java.sql.Date(to.getTime()).toLocalDate())))
                .sorted((a, b) -> ascending ? a.getLogTime().compareTo(b.getLogTime()) : b.getLogTime().compareTo(a.getLogTime()))
                .collect(Collectors.toList());
        }
    }

    private void exportWithChooser(String format) {
        String extension = "xlsx";
        if (format.equals("CSV")) extension = "csv";
        else if (format.equals("PDF")) extension = "pdf";
        fileChooser.setSelectedFile(new File(fileChooser.getCurrentDirectory(), "auditlogs_" + new SimpleDateFormat("yyyyMMdd").format(new Date()) + "." + extension));
        // Set the file filter
        for (int i = 0; i < fileChooser.getChoosableFileFilters().length; i++) {
            javax.swing.filechooser.FileFilter filter = fileChooser.getChoosableFileFilters()[i];
            if (filter.getDescription().toLowerCase().contains(extension)) {
                fileChooser.setFileFilter(filter);
                break;
            }
        }
        int result = fileChooser.showSaveDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            File chosen = fileChooser.getSelectedFile();
            String path = chosen.getAbsolutePath();
            if (!path.toLowerCase().endsWith("." + extension)) {
                path += "." + extension;
            }
            tfFile.setText(path);
            exportFile(format);
        }
    }

    private void exportFile(String format) {
        List<AuditLog> logs = getExportLogs();
        String filePath = tfFile.getText();
        // Ensure correct extension is appended
        String extension = "xlsx";
        if (format.equals("CSV")) extension = "csv";
        else if (format.equals("PDF")) extension = "pdf";
        if (!filePath.toLowerCase().endsWith("." + extension)) {
            filePath += "." + extension;
            tfFile.setText(filePath);
        }
        hardwarehub_main.model.User user = hardwarehub_main.model.User.getCurrentUser();
        int sellerId = user != null ? user.getSellerId() : 0;
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String details = "Exported audit logs to: " + filePath + " (" + format + ")";
        AuditLog exportLog = new AuditLog(0, sellerId, now, true, "AuditLogPanel", "Export", details);
        hardwarehub_main.dao.AuditLogDAO.insertAuditLog(exportLog);
        List<AuditLog> logsWithExport = new java.util.ArrayList<>(logs);
        logsWithExport.add(exportLog);
        // Sort logsWithExport according to current sort order
        boolean ascending = cbSortOrder.getSelectedItem().equals("Ascending");
        logsWithExport.sort((a, b) -> ascending ? a.getLogTime().compareTo(b.getLogTime()) : b.getLogTime().compareTo(a.getLogTime()));
        try {
            switch (format) {
                case "CSV" -> exportCsv(filePath, logsWithExport);
                case "XLSX" -> exportXlsx(filePath, logsWithExport);
                case "PDF" -> exportPdf(filePath, logsWithExport);
            }
            JOptionPane.showMessageDialog(this, "Exported to " + format + " successfully.");
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Export failed: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void exportCsv(String filePath, List<AuditLog> logs) throws Exception {
        int confirm = JOptionPane.showConfirmDialog(this, "Export audit logs to CSV?", "Confirm Export", JOptionPane.YES_NO_OPTION);
        if (confirm != JOptionPane.YES_OPTION) return;
        try (CSVWriter writer = new CSVWriter(new FileWriter(filePath))) {
            // Visually obvious header and date
            writer.writeNext(new String[]{"CWL Hardware"});
            writer.writeNext(new String[]{"Generated on: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date())});
            writer.writeNext(COLUMNS); // Column headers
            // Data rows
            for (AuditLog log : logs) {
                writer.writeNext(new String[]{
                    log.getLogTime() != null ? EXPORT_DATE_FORMAT.format(java.sql.Timestamp.valueOf(log.getLogTime())) : "",
                    log.getPanel(),
                    log.getAction(),
                    log.getDetails()
                });
            }
        }
    }

    private void exportXlsx(String filePath, List<AuditLog> logs) throws Exception {
        int confirm = JOptionPane.showConfirmDialog(this, "Export audit logs to XLSX?", "Confirm Export", JOptionPane.YES_NO_OPTION);
        if (confirm != JOptionPane.YES_OPTION) return;
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Audit Logs");
            // Visually obvious big header
            Row bigHeader = sheet.createRow(0);
            Cell bigHeaderCell = bigHeader.createCell(0);
            bigHeaderCell.setCellValue("CWL Hardware");
            CellStyle bigHeaderStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font bigFont = workbook.createFont();
            bigFont.setFontName("Arial Black");
            bigFont.setFontHeightInPoints((short)28);
            bigFont.setBold(true);
            bigHeaderStyle.setFont(bigFont);
            bigHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
            bigHeaderCell.setCellStyle(bigHeaderStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, COLUMNS.length-1));
            // Visually obvious generated date
            Row genRow = sheet.createRow(1);
            Cell genCell = genRow.createCell(0);
            genCell.setCellValue("Generated on: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()));
            CellStyle genStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font genFont = workbook.createFont();
            genFont.setBold(true);
            genStyle.setFont(genFont);
            genStyle.setAlignment(HorizontalAlignment.CENTER);
            genCell.setCellStyle(genStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, COLUMNS.length-1));
            // Table header
            Row header = sheet.createRow(2);
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setWrapText(true);
            for (int i = 0; i < COLUMNS.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(COLUMNS[i]);
                cell.setCellStyle(headerStyle);
            }
            int rowIdx = 3;
            for (AuditLog log : logs) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(log.getLogTime() != null ? EXPORT_DATE_FORMAT.format(java.sql.Timestamp.valueOf(log.getLogTime())) : "");
                row.createCell(1).setCellValue(log.getPanel());
                row.createCell(2).setCellValue(log.getAction());
                row.createCell(3).setCellValue(log.getDetails());
            }
            int lastRow = sheet.getLastRowNum();
            CellStyle wrapCenter = workbook.createCellStyle();
            wrapCenter.setAlignment(HorizontalAlignment.CENTER);
            wrapCenter.setVerticalAlignment(VerticalAlignment.CENTER);
            wrapCenter.setWrapText(true);
            for (int r = 0; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row != null) {
                    for (int c = 0; c < COLUMNS.length; c++) {
                        Cell cell = row.getCell(c);
                        if (cell == null) {
                            cell = row.createCell(c);
                        }
                        cell.setCellStyle(wrapCenter);
                    }
                }
            }
            for (int i = 0; i < COLUMNS.length; i++) {
                sheet.autoSizeColumn(i);
            }
            try (FileOutputStream fos = new FileOutputStream(filePath)) {
                workbook.write(fos);
            }
        }
        JOptionPane.showMessageDialog(this, "Exported to XLSX successfully.");
    }

    private void exportPdf(String filePath, List<AuditLog> logs) throws Exception {
        int confirm = JOptionPane.showConfirmDialog(this, "Export audit logs to PDF?", "Confirm Export", JOptionPane.YES_NO_OPTION);
        if (confirm != JOptionPane.YES_OPTION) return;
        Document document = new Document(PageSize.A4.rotate());
        PdfWriter.getInstance(document, new FileOutputStream(filePath));
        document.open();
        // Add Logo
        try {
            ImageIcon logoIcon = IconUtil.loadIcon("HardwareHub_Logo.png");
            if (logoIcon != null) {
                com.itextpdf.text.Image logo = com.itextpdf.text.Image.getInstance(logoIcon.getImage(), null);
                logo.scaleToFit(100, 100);
                logo.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
                document.add(logo);
                document.add(new com.itextpdf.text.Paragraph("\n"));
            }
        } catch (Exception e) {}
        // Visually obvious title and date
        com.itextpdf.text.Font titleFont = new com.itextpdf.text.Font(
            com.itextpdf.text.Font.FontFamily.HELVETICA, 28, com.itextpdf.text.Font.BOLD, com.itextpdf.text.BaseColor.DARK_GRAY
        );
        com.itextpdf.text.Paragraph title = new com.itextpdf.text.Paragraph("CWL Hardware", titleFont);
        title.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        document.add(title);
        com.itextpdf.text.Paragraph gen = new com.itextpdf.text.Paragraph("Generated on: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()));
        gen.setAlignment(com.itextpdf.text.Element.ALIGN_CENTER);
        gen.getFont().setStyle(com.itextpdf.text.Font.BOLD);
        document.add(gen);
        document.add(com.itextpdf.text.Chunk.NEWLINE);
        // Table
        PdfPTable table = new PdfPTable(COLUMNS.length);
        table.setWidthPercentage(100);
        com.itextpdf.text.Font headerFont = new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, 12, com.itextpdf.text.Font.BOLD, com.itextpdf.text.BaseColor.WHITE);
        for (String col : COLUMNS) {
            PdfPCell headerCell = new PdfPCell(new Phrase(col, headerFont));
            headerCell.setBackgroundColor(BaseColor.DARK_GRAY);
            headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(headerCell);
        }
        for (AuditLog log : logs) {
            table.addCell(log.getLogTime() != null ? EXPORT_DATE_FORMAT.format(java.sql.Timestamp.valueOf(log.getLogTime())) : "");
            table.addCell(log.getPanel());
            table.addCell(log.getAction());
            table.addCell(log.getDetails());
        }
        document.add(table);
        document.close();
    }
} 