import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
    header: { borderBottom: 2, borderBottomColor: '#2b6cb0', marginBottom: 20, paddingBottom: 10 },
    name: { fontSize: 24, color: '#2b6cb0', fontWeight: 'bold' },
    contact: { flexDirection: 'row', gap: 10, marginTop: 5, color: '#666' },
    section: { marginBottom: 15 },
    sectionTitle: { fontSize: 14, color: '#2b6cb0', fontWeight: 'bold', borderBottom: 1, borderBottomColor: '#eee', marginBottom: 8, paddingBottom: 3 },
    item: { marginBottom: 10 },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: 3 },
    role: { fontWeight: 'bold', color: '#000' },
    company: { fontStyle: 'italic', color: '#444' },
    date: { color: '#666', fontSize: 9 },
    bullet: { marginLeft: 10, marginBottom: 2 },
    skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    skillTag: { backgroundColor: '#edf2f7', padding: '2 6', borderRadius: 4, color: '#2d3748' }
});

const ModernTemplate = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.name}>{data.personalInfo.name}</Text>
                <View style={styles.contact}>
                    <Text>{data.personalInfo.email}</Text>
                    <Text>|</Text>
                    <Text>{data.personalInfo.phone}</Text>
                    {data.personalInfo.linkedin && (
                        <>
                            <Text>|</Text>
                            <Text>{data.personalInfo.linkedin}</Text>
                        </>
                    )}
                </View>
            </View>

            {data.summary && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SUMMARY</Text>
                    <Text>{data.summary}</Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>EXPERIENCE</Text>
                {data.experience.map((exp, i) => (
                    <View key={i} style={styles.item}>
                        <View style={styles.itemHeader}>
                            <Text style={styles.role}>{exp.role}</Text>
                            <Text style={styles.date}>{exp.startDate} - {exp.endDate}</Text>
                        </View>
                        <Text style={styles.company}>{exp.company} | {exp.location}</Text>
                        {exp.description.map((bullet, bi) => (
                            <Text key={bi} style={styles.bullet}>• {bullet}</Text>
                        ))}
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>SKILLS</Text>
                <View style={styles.skills}>
                    {data.skills.technical.map((s, i) => (
                        <View key={i} style={styles.skillTag}><Text>{s}</Text></View>
                    ))}
                    {data.skills.soft.map((s, i) => (
                        <View key={i} style={styles.skillTag}><Text>{s}</Text></View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>EDUCATION</Text>
                {data.education.map((edu, i) => (
                    <View key={i} style={styles.item}>
                        <View style={styles.itemHeader}>
                            <Text style={styles.role}>{edu.degree}</Text>
                            <Text style={styles.date}>{edu.year}</Text>
                        </View>
                        <Text style={styles.company}>{edu.school} | {edu.location}</Text>
                    </View>
                ))}
            </View>
        </Page>
    </Document>
);

export default ModernTemplate;
