import { useState } from 'react';
import { Button } from '@mui/material';
import { Document, Page, Text, Image, View, StyleSheet, pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';

import { courses, Course } from '~/config/courses';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  qrCode: {
    width: 300,
    height: 300,
    marginBottom: 30,
  },
  courseName: {
    fontSize: 24,
    textAlign: 'center',
  },
});

function QrPosterDocument({ qrDataUrl, courseName }: { qrDataUrl: string; courseName: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Löysitkö kiekon?</Text>
        <View>
          <Image src={qrDataUrl} style={styles.qrCode} />
        </View>
        <Text style={styles.courseName}>{courseName}</Text>
      </Page>
    </Document>
  );
}

async function generateAndDownloadPdf(course: Course) {
  const baseUrl = window.location.origin;
  const url = `${baseUrl}/notify/${course.slug}`;

  const qrDataUrl = await QRCode.toDataURL(url, { width: 600, margin: 2 });

  const blob = await pdf(<QrPosterDocument qrDataUrl={qrDataUrl} courseName={course.name} />).toBlob();

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
