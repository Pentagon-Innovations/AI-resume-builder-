import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 50, fontFamily: 'Times-Roman', fontSize: 11, color: '#000' },
    header: { textAlign: 'center', marginBottom: 20 },
    name: { fontSize: 22, fontWeight: 'bold' },
    contact: { fontSize: 10, marginTop: 4 },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', borderBottom: 1, borderBottomColor: '#000', marginTop: 15, marginBottom: 8, textTransform: 'uppercase' },
    item: { marginBottom: 10 },
    role: { fontWeight: 'bold' },
    company: { fontStyle: 'italic' },
    date: { textAlign: 'right', fontSize: 10 },
    bullet: { marginLeft: 15, marginTop: 2 }
});

const ClassicTemplate = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.name}>{data.personalInfo.name}</Text>
                <Text style={styles.contact}>
                    {data.personalInfo.email} | {data.personalInfo.phone} | {data.personalInfo.location}
                </Text>
            </View>

            <Text style={styles.sectionTitle}>Experience</Text>
            {data.experience.map((exp, i) => (
                <View key={i} style={styles.item}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.role}>{exp.role}</Text>
                        <Text style={styles.date}>{exp.startDate} - {exp.endDate}</Text>
                    </View>
                    <Text style={styles.company}>{exp.company}</Text>
                    {exp.description.map((bullet, bi) => (
                        <Text key={bi} style={styles.bullet}>• {bullet}</Text>
                    ))}
                </View>
            ))}

            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu, i) => (
                <View key={i} style={styles.item}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.role}>{edu.school}</Text>
                        <Text style={styles.date}>{edu.year}</Text>
                    </View>
                    <Text>{edu.degree}</Text>
                </View>
            ))}

            <Text style={styles.sectionTitle}>Skills</Text>
            <Text>{[...data.skills.technical, ...data.skills.soft].join(', ')}</Text>
        </Page>
    </Document>
);

export default ClassicTemplate;
