import type { Metadata } from 'next';
import './globals.css';
import { getEmailsDirectoryMetadata } from '../actions/get-emails-directory-metadata';
import { emailsDirectoryAbsolutePath } from '../utils/emails-directory-absolute-path';
import { EmailsProvider } from '../contexts/emails';
import { inter } from './inter';
import { HarmonySetup } from 'harmony-ai-editor'
import { fonts } from '../utils/fonts';


export const metadata: Metadata = {
  title: 'React Email',
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const emailsDirectoryMetadata = await getEmailsDirectoryMetadata(
    emailsDirectoryAbsolutePath,
  );

  if (typeof emailsDirectoryMetadata === 'undefined') {
    throw new Error(
      `Could not find the emails directory specified under ${emailsDirectoryAbsolutePath}!`,
    );
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <EmailsProvider
          initialEmailsDirectoryMetadata={emailsDirectoryMetadata}
          branchId={undefined}
        >
          {children}
        </EmailsProvider>
        <HarmonySetup repositoryId="53e96517-747c-40e4-a230-32409b0270ae" fonts={fonts} source="iframe"/>
      </body>
    </html>
  );
};

export default RootLayout;
