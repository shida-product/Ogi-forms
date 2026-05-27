/**
 * Ogi Pharmacy Enrollment Form (English)
 * Field definitions & i18n dictionary
 */

export const CONFIG = {
  // セキュリティトークン
  apiToken: 'ogi-forms-prod-dfbd023c40ce3bcc',

  // Google Apps Script (GAS) Web API URL（日本語版と同じプロジェクトに投げる）
  gasUrl: 'https://script.google.com/macros/s/AKfycbwOTKmwEitxHSBmev-CnNAzI7r3GRfrqC2luzMSySUJaOOY3SwaTHm7blpH0P_BG8-Y/exec',

  // Pharmacy Information
  pharmacy: {
    name: 'Ogi Pharmacy',
    tagline: 'Membership Registration',
  },

  // Stores
  stores: {
    shibuya: { name: 'Shibuya', label: 'Ogi Pharmacy Shibuya' },
    ebisu: { name: 'Ebisu', label: 'Ogi Pharmacy Ebisu' },
  },
  defaultStore: 'shibuya',

  // Form Fields
  fields: [
    // === Section 1: Personal Information ===
    {
      id: 'full_name',
      type: 'text',
      required: true,
      section: 1,
    },
    {
      id: 'birth_date',
      type: 'date-select',
      required: true,
      section: 1,
    },
    {
      id: 'sex',
      type: 'radio',
      required: true,
      section: 1,
      options: ['male', 'female'],
    },
    {
      id: 'email',
      type: 'email',
      required: true, // English form requires email per requirements
      section: 1,
    },
    {
      id: 'nationality',
      type: 'text',
      required: true,
      section: 1,
    },
    {
      id: 'residence_status',
      type: 'radio',
      required: true,
      section: 1,
      options: ['tourism', 'business', 'resident', 'student', 'other'],
      vertical: true,
    },
    {
      id: 'address_hotel',
      type: 'textarea',
      required: true,
      section: 1,
      condition: (answers) => ['tourism', 'business'].includes(answers.residence_status),
    },
    {
      id: 'postal_code',
      type: 'postal',
      required: true,
      section: 1,
      condition: (answers) => ['resident', 'student', 'other'].includes(answers.residence_status),
    },
    {
      id: 'address',
      type: 'text',
      required: true,
      section: 1,
      condition: (answers) => ['resident', 'student', 'other'].includes(answers.residence_status),
    },
    {
      id: 'address_detail',
      type: 'text',
      required: true,
      section: 1,
      condition: (answers) => ['resident', 'student', 'other'].includes(answers.residence_status),
    },

    // === Section 2: Health Status ===
    {
      id: 'allergy',
      type: 'radio',
      required: true,
      section: 2,
      options: ['yes', 'no'],
    },
    {
      id: 'allergy_detail',
      type: 'textarea',
      required: true,
      section: 2,
      condition: (answers) => answers.allergy === 'yes',
    },
    {
      id: 'current_medicine',
      type: 'radio',
      required: true,
      section: 2,
      options: ['yes', 'no'],
    },
    {
      id: 'current_medicine_detail',
      type: 'textarea',
      required: true,
      section: 2,
      condition: (answers) => answers.current_medicine === 'yes',
    },
    {
      id: 'current_disease',
      type: 'radio',
      required: true,
      section: 2,
      options: ['yes', 'no'],
    },
    {
      id: 'current_disease_detail',
      type: 'textarea',
      required: true,
      section: 2,
      condition: (answers) => answers.current_disease === 'yes',
    },

    // === Section 3: Women's Health ===
    {
      id: 'pregnant',
      type: 'radio',
      required: true,
      section: 3,
      options: ['yes', 'no'],
      condition: (answers) => answers.sex === 'female',
    },
    {
      id: 'pregnant_detail',
      type: 'text',
      required: true,
      section: 3,
      condition: (answers) => answers.sex === 'female' && answers.pregnant === 'yes',
    },
    {
      id: 'breastfeeding',
      type: 'radio',
      required: true,
      section: 3,
      options: ['yes', 'no'],
      condition: (answers) => answers.sex === 'female',
    },
    {
      id: 'breastfeeding_detail',
      type: 'text',
      required: true,
      section: 3,
      condition: (answers) => answers.sex === 'female' && answers.breastfeeding === 'yes',
    },

    // === Section 4: Quick Survey ===
    {
      id: 'referral_source',
      type: 'radio',
      required: false,
      section: 4,
      options: ['map', 'search_medicine', 'referral', 'walked_by', 'other_survey'],
      hasOther: true,
      vertical: true,
    },
  ],

  // Text Dictionary
  i18n: {
    // Sections
    sections: {
      1: 'Personal Information',
      2: 'Health Status',
      3: 'Women\'s Health',
      4: 'Quick Survey',
    },
    stepperLabels: {
      1: 'Profile',
      2: 'Health',
      3: 'Women',
      4: 'Finish',
    },
    descriptions: {
      1: 'Your basic info.',
      2: 'Your current health status.',
      3: '(Female patients only)',
      4: 'Just a quick survey.',
    },
    
    // Labels
    labels: {
      full_name: 'Full Name',
      birth_date: 'Date of Birth',
      sex: 'Gender',
      email: 'Email',
      nationality: 'Nationality',
      residence_status: 'Residence Status',
      address_hotel: 'Accommodation',
      postal_code: 'Postal / Zip Code',
      address: 'Prefecture / City',
      address_detail: 'Street / Building / Room',

      allergy: 'Any allergies?',
      allergy_detail: 'Please specify',
      current_medicine: 'Currently taking any medications?',
      current_medicine_detail: 'Please list them',
      current_disease: 'Under treatment for any conditions?',
      current_disease_detail: 'Please specify',

      pregnant: 'Pregnant or possibly pregnant?',
      pregnant_detail: 'How many weeks?',
      breastfeeding: 'Currently breastfeeding?',
      breastfeeding_detail: 'Baby\'s age (months)',

      referral_source: 'How did you hear about us?',
    },

    // Options
    options: {
      yes: 'Yes',
      no: 'No',
      male: 'Male',
      female: 'Female',
      
      tourism: 'Short-term (Tourism)',
      business: 'Short-term (Business)',
      resident: 'Resident',
      student: 'Student',
      other: 'Other',
      
      map: 'Map app (Google Maps, etc.)',
      search_medicine: 'Searched by medication name',
      referral: 'Friend or Family',
      walked_by: 'Walked by',
      other_survey: 'Other',
    },

    // Placeholders
    placeholders: {
      full_name: 'e.g. John Doe',
      email: 'e.g. example@email.com',
      nationality: 'e.g. USA',
      address_hotel: 'e.g. ABC Hotel, 1-2-3 Ebisu, Shibuya-ku, Tokyo',
      postal_code: 'e.g. 1500041',
      address: 'Autofills from Zip Code',
      address_detail: 'e.g. 1-2-3 Ebisu, ABC Condominium #101',
      allergy_detail: 'e.g. Peanuts, Penicillin',
      current_medicine_detail: 'e.g. Aspirin 100mg, Vitamin C',
      current_disease_detail: 'e.g. Asthma, Hypertension',
      pregnant_detail: 'e.g. 12 weeks',
      breastfeeding_detail: 'e.g. 6 months',
    },

    // Helpers
    helpers: {
      full_name: 'As shown on your passport (A–Z only).',
      address_hotel: 'Hotel name only is fine. Google Maps address also works.',
      postal_code: '7 digits auto-fills Prefecture & City (in Japanese).',
    },

    // Date Select Labels
    dateLabels: {
      yearPlaceholder: 'Year',
      monthPlaceholder: 'Month',
      dayPlaceholder: 'Day',
      yearSuffix: '',
      monthSuffix: '',
      daySuffix: '',
      monthNames: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
    },

    // Buttons
    buttons: {
      next: 'Next',
      prev: 'Back',
      submit: 'Complete',
      submitting: 'Processing...',
      start: 'Start Registration',
    },

    // Messages
    messages: {
      success_title: 'Registration Complete',
      success_body: 'Thank you. You may close this window.\nFeel free to ask our staff if you have questions.',
      error_general: 'Submission failed. Please try again.',
      required: 'Required',
      invalid_kana: 'Invalid format',
      invalid_phone: 'Invalid phone number',
      invalid_postal: '7 digits required',
      invalid_email: 'Invalid email',
      privacy_required: 'Please agree to the privacy policy.',
      other_placeholder: 'Please specify',
      optional: '- Optional',
    },

    // Intro
    intro: {
      greeting: 'Welcome to Ogi Pharmacy',
      main: 'First-time visitors, please fill out this form.',
      content: '[ Information Needed ]\n- Personal & Contact Info\n- Current Address in Japan\n- Allergies & Health Status\n- Current Medications',
      time: 'About 3 mins',
      privacyNote: '* Your data is handled per our privacy policy and never shared without consent.',
    },

  },
};
