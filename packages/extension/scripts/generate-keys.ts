import fs from 'fs';
import forge from 'node-forge';
import { CertGenerator, ITlsOptions } from 'get-set-fetch-extension-test-utils';

// 1. generate and store ca certificate
const caSubjectAttrs = [
  { name: 'commonName', value: 'ca.gsf' },
  { name: 'countryName', value: 'RO' },
  { shortName: 'ST', value: 'Bucharest' },
  { name: 'localityName', value: 'Bucharest' },
  { name: 'organizationName', value: 'gsf' },
  { shortName: 'OU', value: 'ca.gsf' },
];

const caIssuerAttrs = caSubjectAttrs;

const caExtensions = [
  {
    name: 'basicConstraints',
    cA: true,
  },
  {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true,
  },
  {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true,
    codeSigning: false,
    emailProtection: false,
    timeStamping: true,
  },
  {
    name: 'nsCertType',
    client: true,
    server: true,
    email: false,
    objsign: false,
    sslCA: true,
    emailCA: false,
    objCA: false,
  },
  {
    name: 'subjectKeyIdentifier',
  },
];

const caTlsOpts: ITlsOptions = CertGenerator.generateCertificate(caSubjectAttrs, caIssuerAttrs, caExtensions);
fs.writeFileSync('./test/resources/security/ca/ca-private-key.pem', caTlsOpts.privateKey);
fs.writeFileSync('./test/resources/security/ca/ca-public-key-cert.pem', caTlsOpts.publicKeyCertificate);
fs.writeFileSync('./test/resources/security/ca/ca-private-key-cert.p12', Buffer.from(forge.util.binary.raw.decode(caTlsOpts.privateKeyCertificate)), 'binary');

// 2. generate and store web srv certificate
const webSubjectAttrs = [
  { name: 'commonName', value: 'web.gsf' },
  { name: 'countryName', value: 'RO' },
  { shortName: 'ST', value: 'Bucharest' },
  { name: 'localityName', value: 'Bucharest' },
  { name: 'organizationName', value: 'gsf' },
  { shortName: 'OU', value: 'web.gsf' },
];

const webExtensions = [
  {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true,
  },
  {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true,
    codeSigning: false,
    emailProtection: false,
    timeStamping: true,
  },
  {
    name: 'nsCertType',
    client: true,
    server: true,
    email: false,
    objsign: false,
    sslCA: true,
    emailCA: false,
    objCA: false,
  },
  {
    name: 'subjectAltName',
    altNames: [
      {
        type: 2,
        value: 'www.sitea.com',
      },
      {
        type: 2,
        value: 'sitea.com',
      },
      {
        type: 2,
        value: 'localhost',
      },
      {
        type: 7, // IP
        ip: '127.0.0.1',
      },
    ],
  },
  {
    name: 'subjectKeyIdentifier',
  },
];
const webTlsOpts: ITlsOptions = CertGenerator.generateCertificate(webSubjectAttrs, caIssuerAttrs, webExtensions, caTlsOpts.privateKey, caTlsOpts.publicKeyCertificate);
fs.writeFileSync('./test/resources/security/web/web-private-key.pem', webTlsOpts.privateKey);
fs.writeFileSync('./test/resources/security/web/web-public-key-cert.pem', webTlsOpts.publicKeyCertificate);
fs.writeFileSync('./test/resources/security/web/web-private-key-cert.p12', Buffer.from(forge.util.binary.raw.decode(webTlsOpts.privateKeyCertificate)), 'binary');
