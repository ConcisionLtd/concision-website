import test from 'node:test';
import assert from 'node:assert/strict';
import { siteConfig } from '../../site.config.js';

test('site URL is the https apex domain', () => {
  assert.equal(siteConfig.siteUrl, 'https://concision.io');
});

test('company number is an eight digit Companies House number', () => {
  assert.match(siteConfig.company.number, /^\d{8}$/);
});

test('founding date is an ISO date and the founding year matches it', () => {
  assert.match(siteConfig.company.foundingDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(siteConfig.company.foundingYear, siteConfig.company.foundingDate.slice(0, 4));
});

test('contact email is on the company domain', () => {
  assert.equal(siteConfig.contactEmail, 'hello@concision.io');
});

test('registered office has every line the footer needs', () => {
  const { registeredOffice } = siteConfig.company;
  for (const key of ['line1', 'line2', 'city', 'postcode', 'country']) {
    assert.ok(registeredOffice[key], `missing registered office ${key}`);
  }
});

test('the Nudge product has an https URL', () => {
  assert.match(siteConfig.products.nudge.url, /^https:\/\//);
});
