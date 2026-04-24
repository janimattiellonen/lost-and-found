import { useState } from 'react';
import { Button } from '@mui/material';
import QRCode from 'qrcode';

import type { Course } from '~/config/courses';
import { getCourseBySlug } from '~/config/courses';

const BIN_FULL_COURSE_SLUGS = ['oittaa'];

async function generateAndDownloadPdf(course: Course) {
  const { Document, Page, Text, Image, StyleSheet, pdf } = await import('@react-pdf/renderer');

  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    logo: {
      width: 140,
      height: 100,
      objectFit: 'contain',
      marginBottom: 20,
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 24,
    },
    qrCode: {
      width: 280,
      height: 280,
      marginBottom: 0,
    },
    url: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 16,
      color: '#555555',
    },
    courseName: {
      fontSize: 22,
      textAlign: 'center',
    },
    greeting: {
      fontSize: 22,
      textAlign: 'center',
      marginTop: 24,
    },
    clubName: {
      fontSize: 18,
      textAlign: 'center',
      marginTop: 6,
    },
  });

  const baseUrl = window.location.origin;
  const url = `${baseUrl}/bin/full/${course.slug}`;

  const qrDataUrl = await QRCode.toDataURL(url, { width: 600, margin: 1 });

  const logoFile = course.clubId === 1 ? 'ps-logo.png' : 'TT-Logo-transparent.png';
  const logoUrl = `${baseUrl}/${logoFile}`;
  const blob = await pdf(
    <Document>
      <Page size="A4" style={styles.page}>
        <Image src={logoUrl} style={styles.logo} />
        <Text style={styles.title}>Löytökiekkolaatikko täynnä?</Text>
        <Text style={styles.subtitle}>Voit ilmoittaa täydestä laatikosta alla olevan linkin kautta</Text>
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
  a.download = `${course.slug}-bin-full-qr.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

export default function BinFullQrPosterButtons() {
  const [generating, setGenerating] = useState<string | null>(null);

  const applicableCourses = BIN_FULL_COURSE_SLUGS.map(getCourseBySlug).filter((c): c is Course => !!c);

  if (applicableCourses.length === 0) {
    return null;
  }

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
      {applicableCourses.map((course) => (
        <Button
          key={course.slug}
          variant="outlined"
          size="small"
          disabled={generating === course.slug}
          onClick={() => handleClick(course)}
        >
          {generating === course.slug ? 'Luodaan...' : `QR (täysi laatikko): ${course.name}`}
        </Button>
      ))}
    </div>
  );
}
