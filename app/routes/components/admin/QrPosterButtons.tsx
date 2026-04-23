import { useState } from 'react';
import { Button } from '@mui/material';
import QRCode from 'qrcode';

import type { Course } from '~/config/courses';
import { courses } from '~/config/courses';

async function generateAndDownloadPdf(course: Course) {
  const { Document, Page, Text, Image, StyleSheet, pdf } = await import('@react-pdf/renderer');

  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    logo: {
      width: 160,
      height: 120,
      objectFit: 'contain',
      marginBottom: 30,
    },
    title: {
      fontSize: 48,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 20,
      textAlign: 'center',
      marginBottom: 40,
    },
    qrCode: {
      width: 300,
      height: 300,
      marginBottom: 0,
    },
    url: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 30,
      color: '#555555',
    },
    courseName: {
      fontSize: 24,
      textAlign: 'center',
    },
    greeting: {
      fontSize: 24,
      textAlign: 'center',
      marginTop: 40,
    },
    clubName: {
      fontSize: 20,
      textAlign: 'center',
      marginTop: 10,
    },
  });

  const baseUrl = window.location.origin;
  const url = `${baseUrl}/notify/${course.slug}`;

  const qrDataUrl = await QRCode.toDataURL(url, { width: 600, margin: 1 });

  const logoFile = course.clubId === 1 ? 'ps-logo.png' : 'TT-Logo-transparent.png';
  const logoUrl = `${baseUrl}/${logoFile}`;
  const blob = await pdf(
    <Document>
      <Page size="A4" style={styles.page}>
        <Image src={logoUrl} style={styles.logo} />
        <Text style={styles.title}>Löysitkö kiekon?</Text>
        <Text style={styles.subtitle}>Voit ilmoittaa siitä alla olevan linkin kautta</Text>
        <Image src={qrDataUrl} style={styles.qrCode} />
        <Text style={styles.url}>{url}</Text>
        <Text style={styles.courseName}>{course.name}</Text>
        <Text style={styles.greeting}>Kiitos!</Text>
        <Text style={styles.clubName}>{course.clubName}</Text>
      </Page>
    </Document>,
  ).toBlob();

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `${course.slug}-qr.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

export default function QrPosterButtons() {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleClick = async (course: Course) => {
    setGenerating(course.slug);
    try {
      await generateAndDownloadPdf(course);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {courses.map((course) => (
        <Button
          key={course.slug}
          variant="outlined"
          size="small"
          disabled={generating === course.slug}
          onClick={() => handleClick(course)}
        >
          {generating === course.slug ? 'Luodaan...' : `QR: ${course.name}`}
        </Button>
      ))}
    </div>
  );
}
