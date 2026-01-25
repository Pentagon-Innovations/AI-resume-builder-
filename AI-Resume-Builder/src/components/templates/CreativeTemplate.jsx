import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { flexDirection: 'row', backgroundColor: '#fff', color: '#333', fontSize: 10, fontFamily: 'Helvetica' },
    sidebar: { width: '35%', backgroundColor: '#2d3748', color: '#fff', padding: 25 },
    main: { width: '65%', padding: 25 },
    name: { fontSize: 22, fontWeight: 'bold', marginBottom: 5, color: '#fff' },
    role: { fontSize: 12, marginBottom: 20, opacity: 0.8 },
    sidebarSectionTitle: { fontSize: 13, fontWeight: 'bold', borderBottom: 1, borderBottomColor: '#4a5568', marginTop: 20, marginBottom: 8, paddingBottom: 3 },
    mainSectionTitle: { fontSize: 14, fontWeight: 'bold', borderBottom: 2, borderBottomColor: '#cbd5e0', marginTop: 15, marginBottom: 10, paddingBottom: 5, color: '#2d3748' },
    item: { marginBottom: 12 },
    boldText: { fontWeight: 'bold' },
    italicText: { fontStyle: 'italic', opacity: 0.9 },
    bullet: { marginLeft: 10, marginTop: 2 },
    contactItem: { marginBottom: 5, fontSize: 9 }
});

const CreativeTemplate = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.sidebar}>
                <Text style={styles.name}>{data.personalInfo.name}</Text>
                <Text style={styles.role}>{data.experience[0]?.role || 'Professional'}</Text>

                <Text style={styles.sidebarSectionTitle}>CONTACT</Text>
                <Text style={styles.contactItem}>Email: {data.personalInfo.email}</Text>
                <Text style={styles.contactItem}>Phone: {data.personalInfo.phone}</Text>
                <Text style={styles.contactItem}>Location: {data.personalInfo.location}</Text>

                <Text style={styles.sidebarSectionTitle}>SKILLS</Text>
                {data.skills.technical.map((s, i) => (
                    <Text key={i} style={{ marginBottom: 3 }}>• {s}</Text>
                ))}
                {data.skills.soft.map((s, i) => (
                    <Text key={i} style={{ marginBottom: 3 }}>• {s}</Text>
                ))}
            </View>

            <View style={styles.main}>
                {data.summary && (
                    <View>
                        <Text style={styles.mainSectionTitle}>PROFILE</Text>
                        <Text>{data.summary}</Text>
                    </View>
                )}

                <View>
                    <Text style={styles.mainSectionTitle}>EXPERIENCE</Text>
                    {data.experience.map((exp, i) => (
                        <View key={i} style={styles.item}>
                            <Text style={styles.boldText}>{exp.role}</Text>
                            <Text style={styles.italicText}>{exp.company} | {exp.startDate} - {exp.endDate}</Text>
                            {exp.description.map((bullet, bi) => (
                                <Text key={bi} style={styles.bullet}>• {bullet}</Text>
                            ))}
                        </View>
                    ))}
                </View>

                <View>
                    <Text style={styles.mainSectionTitle}>EDUCATION</Text>
                    {data.education.map((edu, i) => (
                        <View key={i} style={styles.item}>
                            <Text style={styles.boldText}>{edu.school}</Text>
                            <Text>{edu.degree}</Text>
                            <Text style={styles.italicText}>{edu.year}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </Page>
    </Document>
);

export default CreativeTemplate;
