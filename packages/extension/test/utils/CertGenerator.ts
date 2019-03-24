import forge from 'node-forge';

export default class CertGenerator {
  static generate() {
    const pki = forge.pki;
    const keys = pki.rsa.generateKeyPair(1024);
    const cert = pki.createCertificate();

    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear()+1);

    const attrs = [
      { name:'commonName', value:'get-set-fetch.org' },
      { name:'countryName', value:'RO' },
      { shortName:'ST', value:'Bucharest' },
      { name:'localityName', value:'Bucharest' },
      { name:'organizationName', value:'gsf' },
      { shortName:'OU', value:'gsf' }
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);

    const tlsOtps = {
      key: pki.privateKeyToPem(keys.privateKey),
      cert: pki.certificateToPem(cert),
      ca: pki.certificateToPem(cert)
    };

    return {
      key: tlsOtps.key,
      cert: tlsOtps.cert,
      ca: tlsOtps.cert
    };
  }
}