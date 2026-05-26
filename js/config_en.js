/**
 * Oogi Pharmacy Enrollment Form (English)
 * Field definitions & i18n dictionary
 */

export const CONFIG = {
  // セキュリティトークン
  apiToken: 'ogi-forms-prod-dfbd023c40ce3bcc',

  // Google Apps Script (GAS) Web API URL
  // Replace after deployment
  gasUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',

  // Pharmacy Information
  pharmacy: {
    name: 'Oogi Pharmacy',
    tagline: 'Membership Registration',
  },

  // Stores
  stores: {
    shibuya: { name: 'Shibuya', label: 'Oogi Pharmacy Shibuya' },
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
      options: ['yes', 'no', 'not_sure'],
    },
    {
      id: 'allergy_detail',
      type: 'textarea',
      required: true,
      section: 2,
      condition: (answers) => answers.allergy === 'yes' || answers.allergy === 'not_sure',
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
      id: 'chronic_condition',
      type: 'radio',
      required: true,
      section: 2,
      options: ['yes', 'no'],
    },
    {
      id: 'chronic_condition_detail',
      type: 'textarea',
      required: true,
      section: 2,
      condition: (answers) => answers.chronic_condition === 'yes',
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

    // === Section 4: Survey & Membership ===
    {
      id: 'referral_source',
      type: 'radio',
      required: false,
      section: 4,
      options: ['map', 'search_medicine', 'referral', 'walked_by', 'other_survey'],
      hasOther: true,
      vertical: true,
    },
    {
      id: 'membership_info',
      type: 'info',
      required: false,
      section: 4,
    },
    {
      id: 'privacy_agreement',
      type: 'checkbox',
      required: true,
      section: 4,
    },
  ],

  // Text Dictionary
  i18n: {
    // Sections
    sections: {
      1: 'Personal Information',
      2: 'Health Status',
      3: 'Women\'s Health',
      4: 'Final Details & Consent',
    },
    stepperLabels: {
      1: 'Profile',
      2: 'Health',
      3: 'Women',
      4: 'Finish',
    },
    descriptions: {
      1: 'Please provide your basic information.',
      2: 'Please answer questions about your current health status.',
      3: '(For female patients only)',
      4: 'Please review the information below and agree to our privacy policy.',
    },
    
    // Labels
    labels: {
      full_name: 'Full Name',
      birth_date: 'Date of Birth',
      sex: 'Gender',
      email: 'E-mail Address',
      nationality: 'Nationality',
      residence_status: 'Residence Status in Japan',
      address_hotel: 'Accommodation Address (Hotel Name or Address)',
      postal_code: 'Postal / Zip Code',
      address: 'Prefecture / City',
      address_detail: 'Street / Building / Room',
      
      allergy: 'Do you have any allergies?',
      allergy_detail: 'Please specify',
      current_medicine: 'Are you currently taking any medications or supplements?',
      current_medicine_detail: 'Please list them',
      chronic_condition: 'Are you currently receiving treatment for any medical conditions?',
      chronic_condition_detail: 'Please specify',
      
      pregnant: 'Are you pregnant or possibly pregnant?',
      pregnant_detail: 'How many weeks?',
      breastfeeding: 'Are you currently breastfeeding?',
      breastfeeding_detail: 'How old is your baby (in months)?',
      
      referral_source: 'How did you hear about us?',
      membership_info: 'About Membership',
      privacy_agreement: 'Privacy Policy Agreement',
    },

    // Options
    options: {
      yes: 'Yes',
      no: 'No',
      not_sure: 'Not sure',
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
      address_hotel: 'Please paste your hotel address here.\ne.g. 1-2-3 Ebisu, Shibuya-ku, Tokyo\nABC Hotel Room 101',
      postal_code: 'e.g. 1500041',
      address: 'Autofills from Zip Code',
      address_detail: 'e.g. 1-2-3 Ebisu, ABC Condominium #101',
      allergy_detail: 'e.g. Peanuts, Penicillin',
      current_medicine_detail: 'e.g. Aspirin 100mg, Vitamin C',
      chronic_condition_detail: 'e.g. Asthma, Hypertension',
      pregnant_detail: 'e.g. 12 weeks',
      breastfeeding_detail: 'e.g. 6 months',
    },

    // Helpers
    helpers: {
      full_name: 'Please enter your full name as it appears on your passport (A–Z only).',
      address_hotel: '※ Just the hotel name is OK! (Or you can paste the full address from Google Maps)',
      postal_code: 'Entering your 7-digit Zip Code will automatically fill in your Prefecture and City (in Japanese).',
      privacy_agreement: 'Your information will only be used for pharmacy operations such as dispensing and medication guidance. It will not be shared with third parties.',
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
      submit: 'Complete Registration',
      submitting: 'Processing...',
      start: 'Start Registration',
    },

    // Messages
    messages: {
      success_title: 'Registration Complete',
      success_body: 'Thank you for filling out the form.\nYou may safely close this window.\nIf you have any questions, feel free to ask our staff.',
      error_general: 'An error occurred during submission. Please try again.',
      required: 'Required',
      invalid_kana: 'Invalid format',
      invalid_phone: 'Invalid phone number',
      invalid_postal: '7 digits required',
      invalid_email: 'Invalid email address',
      privacy_required: 'You must agree to the privacy policy.',
      other_placeholder: 'Please specify',
      optional: '- Optional',
    },

    // Intro
    intro: {
      greeting: 'Welcome to Oogi Pharmacy',
      main: 'We ask all first-time visitors to complete this registration form.',
      content: '[ Information Needed ]\n- Personal & Contact Info\n- Current Address in Japan\n- Allergies & Health Status\n- Current Medications',
      time: 'Estimated time: 3 mins',
    },

    // Info components special content
    info: {
      membership_info: {
        text: 'We issue a Membership Card to all new patients.\nShow this card on your next visit within a year, and your basic pharmacy fee will be waived — you\'ll only pay for your medication.',
        image: 'image/Member_card.png',
        alt: 'Membership Card'
      }
    }
  },
};
