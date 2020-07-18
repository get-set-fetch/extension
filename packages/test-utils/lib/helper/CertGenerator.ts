import { pki, pkcs12, asn1, md } from 'node-forge';

export interface ITlsOptions {
  privateKey: string;
  publicKeyCertificate: string;
  privateKeyCertificate: string;
}

export default class CertGenerator {
  static generateCertificate(
    subjectAttrs: pki.CertificateField[],
    issuerAttrs: pki.CertificateField[],
    extensions: any[],
    pemSignKey: string = null,
    caCertPem: string = null,
  ): ITlsOptions {
    const keys = pki.rsa.generateKeyPair(1024);
    const cert = pki.createCertificate();

    cert.publicKey = keys.publicKey;
    cert.serialNumber = pemSignKey ? '01' : '02';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    cert.setSubject(subjectAttrs);
    cert.setIssuer(issuerAttrs);
    cert.setExtensions(extensions);
    cert.sign(pemSignKey ? pki.privateKeyFromPem(pemSignKey) : keys.privateKey, md.sha256.create());

    const certChain = caCertPem ? [ pki.certificateFromPem(caCertPem), cert ] : [ cert ];
    const p12Asn1 = pkcs12.toPkcs12Asn1(
      keys.privateKey, certChain, 'password',
      { algorithm: '3des' },
    );
    const p12Der = asn1.toDer(p12Asn1).getBytes();

    return {
      privateKey: pki.privateKeyToPem(keys.privateKey),
      publicKeyCertificate: pki.certificateToPem(cert),
      privateKeyCertificate: p12Der,
    };
  }
}
