'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('bare_acts', [
      {
        name: 'Bharatiya Nyaya Sanhita, 2023',
        abbreviation: 'BNS',
        effective_date: '2024-07-01',
        type: 'Central',
        description: 'Replaces the Indian Penal Code, 1860. 358 sections.',
        sections_count: 358,
        is_bookmarked: true,
        pdf_file: 'BNS.pdf',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
        abbreviation: 'BNSS',
        effective_date: '2024-07-01',
        type: 'Central',
        description: 'Replaces the Code of Criminal Procedure, 1973. 531 sections.',
        sections_count: 531,
        is_bookmarked: false,
        pdf_file: 'BNSS.pdf',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Bharatiya Sakshya Adhiniyam, 2023',
        abbreviation: 'BSA',
        effective_date: '2024-07-01',
        type: 'Central',
        description: 'Replaces the Indian Evidence Act, 1872. 170 sections.',
        sections_count: 170,
        is_bookmarked: true,
        pdf_file: 'BSA.pdf',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Code of Civil Procedure, 1908',
        abbreviation: 'CPC',
        effective_date: '1908-01-01',
        type: 'Central',
        description: 'Procedure for civil courts. Sections and Orders I–LI.',
        sections_count: 158,
        is_bookmarked: true,
        pdf_file: 'CPC.pdf',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Transfer of Property Act, 1882',
        abbreviation: 'TPA',
        effective_date: '1882-01-01',
        type: 'Central',
        description: 'Sale, mortgage, lease, exchange and gift of immovable property.',
        sections_count: 137,
        is_bookmarked: true,
        pdf_file: 'TPA.pdf',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Registration Act, 1908',
        abbreviation: 'RA',
        effective_date: '1908-01-01',
        type: 'Central',
        description: 'Registration of documents relating to immovable property.',
        sections_count: 91,
        is_bookmarked: false,
        pdf_file: 'RA.pdf',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Specific Relief Act, 1963',
        abbreviation: 'SRA',
        effective_date: '1963-01-01',
        type: 'Central',
        description: 'Specific performance, injunctions and declaratory decrees.',
        sections_count: 44,
        is_bookmarked: true,
        pdf_file: 'SRA.pdf',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'A.P. Rights in Land and Pattadar Pass Books Act, 1971',
        abbreviation: 'ROR',
        effective_date: '1971-01-01',
        type: 'State — A.P.',
        description: 'Record of rights, pattadar pass books and title deeds.',
        sections_count: 19,
        is_bookmarked: false,
        pdf_file: 'ROR.pdf',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'A.P. Land Grabbing (Prohibition) Act, 1982',
        abbreviation: 'APLG',
        effective_date: '1982-01-01',
        type: 'State — A.P.',
        description: 'Special courts and tribunal for land grabbing matters.',
        sections_count: 17,
        is_bookmarked: false,
        pdf_file: 'APLG.pdf',
        created_at: now,
        updated_at: now,
      },
    ]);

    const effectiveDate = '2024-07-01';

    await queryInterface.bulkInsert('amendments', [
      // IPC → BNS
      { source_act: 'Indian Penal Code, 1860', target_act: 'Bharatiya Nyaya Sanhita, 2023', old_section: '302', old_title: 'Murder', new_section: '103', new_title: 'Murder', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Indian Penal Code, 1860', target_act: 'Bharatiya Nyaya Sanhita, 2023', old_section: '420', old_title: 'Cheating and dishonestly inducing delivery of property', new_section: '318(4)', new_title: 'Cheating', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Indian Penal Code, 1860', target_act: 'Bharatiya Nyaya Sanhita, 2023', old_section: '379', old_title: 'Theft', new_section: '303(2)', new_title: 'Theft', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Indian Penal Code, 1860', target_act: 'Bharatiya Nyaya Sanhita, 2023', old_section: '376', old_title: 'Rape', new_section: '64', new_title: 'Rape', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Indian Penal Code, 1860', target_act: 'Bharatiya Nyaya Sanhita, 2023', old_section: '499', old_title: 'Defamation', new_section: '356', new_title: 'Defamation', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Indian Penal Code, 1860', target_act: 'Bharatiya Nyaya Sanhita, 2023', old_section: '406', old_title: 'Criminal breach of trust', new_section: '316', new_title: 'Criminal breach of trust', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Indian Penal Code, 1860', target_act: 'Bharatiya Nyaya Sanhita, 2023', old_section: '506', old_title: 'Criminal intimidation', new_section: '351', new_title: 'Criminal intimidation', effective_date: effectiveDate, created_at: now, updated_at: now },

      // CrPC → BNSS
      { source_act: 'Code of Criminal Procedure, 1973', target_act: 'Bharatiya Nagarik Suraksha Sanhita, 2023', old_section: '154', old_title: 'Information in cognizable cases (FIR)', new_section: '173', new_title: 'Information in cognizable cases', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Code of Criminal Procedure, 1973', target_act: 'Bharatiya Nagarik Suraksha Sanhita, 2023', old_section: '41', old_title: 'When police may arrest without warrant', new_section: '35', new_title: 'When police may arrest without warrant', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Code of Criminal Procedure, 1973', target_act: 'Bharatiya Nagarik Suraksha Sanhita, 2023', old_section: '161', old_title: 'Examination of witnesses by police', new_section: '180', new_title: 'Examination of witnesses by police', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Code of Criminal Procedure, 1973', target_act: 'Bharatiya Nagarik Suraksha Sanhita, 2023', old_section: '125', old_title: 'Maintenance of wives, children and parents', new_section: '144', new_title: 'Maintenance of wives, children and parents', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Code of Criminal Procedure, 1973', target_act: 'Bharatiya Nagarik Suraksha Sanhita, 2023', old_section: '438', old_title: 'Anticipatory bail', new_section: '482', new_title: 'Anticipatory bail', effective_date: effectiveDate, created_at: now, updated_at: now },

      // Evidence Act → BSA
      { source_act: 'Indian Evidence Act, 1872', target_act: 'Bharatiya Sakshya Adhiniyam, 2023', old_section: '3', old_title: 'Interpretation clause', new_section: '2', new_title: 'Definitions', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Indian Evidence Act, 1872', target_act: 'Bharatiya Sakshya Adhiniyam, 2023', old_section: '65B', old_title: 'Admissibility of electronic records', new_section: '63', new_title: 'Admissibility of electronic records', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Indian Evidence Act, 1872', target_act: 'Bharatiya Sakshya Adhiniyam, 2023', old_section: '45', old_title: 'Opinion of experts', new_section: '39', new_title: 'Opinion of experts', effective_date: effectiveDate, created_at: now, updated_at: now },
      { source_act: 'Indian Evidence Act, 1872', target_act: 'Bharatiya Sakshya Adhiniyam, 2023', old_section: '32', old_title: 'Statement of person who cannot be called as witness', new_section: '26', new_title: 'Statement of person who cannot be called', effective_date: effectiveDate, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('amendments', null, {});
    await queryInterface.bulkDelete('bare_acts', null, {});
  },
};
