package com.fyp.supervision.proposal;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Mirrors the official MMU FCI FYP Proposal Form template:
 * Project-info/template/FYP Proposal Form.docx.
 *
 * Single source of truth for backend-side validation of project status,
 * type, specialisation, category and focus values.
 */
public final class ProposalTemplateOptions {

    public static final Set<String> PROJECT_STATUS = Set.of(
            "Supervisor-Proposed", "Student-Proposed", "Industry-Proposed");

    public static final Set<String> PROJECT_TYPE = Set.of(
            "Application-Based", "Research-Based");

    public static final Set<String> NUMBER_OF_STUDENTS = Set.of("One", "Two");

    public static final Set<String> SPECIALISATIONS = Set.of(
            "Software Engineering",
            "Data Science",
            "Cybersecurity",
            "Game Development",
            "Information Systems");

    public static final Map<String, List<String>> CATEGORIES_BY_SPEC = Map.of(
            "Software Engineering", List.of(
                    "Critical System",
                    "Application Software",
                    "Software Tools & Utilities",
                    "Service Oriented Computing"),
            "Data Science", List.of(
                    "Data Engineering",
                    "Data Analytics"),
            "Cybersecurity", List.of(
                    "Cryptography and Data Security",
                    "Investigation and Analysis",
                    "Security and Defence"),
            "Game Development", List.of(
                    "Game Software Development (GSD)",
                    "Game Algorithm Research (GAR)",
                    "Game Design Prototyping (GDP)"),
            "Information Systems", List.of(
                    "IT Infrastructure",
                    "Transaction Processing Systems",
                    "Intelligent Systems"));

    public static final Map<String, List<String>> FOCUS_BY_SPEC = Map.of(
            "Software Engineering", List.of(
                    "Product Development",
                    "Prototype/Proof of Concept",
                    "Software Engineering Methodologies",
                    "Others"),
            "Data Science", List.of(
                    "Data Management",
                    "IoT",
                    "Optimisation of Technologies",
                    "Analysis of data (texts, videos, images, numerical digit)",
                    "Others"),
            "Cybersecurity", List.of(
                    "Cryptography",
                    "Database Security",
                    "Blockchain",
                    "Malware analysis",
                    "Forensics",
                    "Ethical hacking",
                    "Network and Cloud Security",
                    "Others"),
            "Game Development", List.of(
                    "Game Software Development (GSD): development and implementation of a complete game from design to production",
                    "Game Algorithm Research (GAR): investigation and analysis of specific algorithms used in games",
                    "Game Design Prototyping (GDP): proof of concept of novel specific game design concepts via complete prototypes"),
            "Information Systems", List.of(
                    "Data & Information Management",
                    "User Experience",
                    "System Analysis & Design",
                    "IS Project Management",
                    "Business Processes",
                    "Technology Evaluation",
                    "Others"));

    private ProposalTemplateOptions() {}
}
