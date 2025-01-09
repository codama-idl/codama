import { describe, expect, test } from 'vitest';

import { camelCase, snakeCase, titleCase } from '../../src';

describe('snakeCase', () => {
    test('casing', () => {
        expect(snakeCase('lowercased')).toBe('lowercased');
        expect(snakeCase('UPPERCASED')).toBe('u_p_p_e_r_c_a_s_e_d');
        expect(snakeCase('Capitalized')).toBe('capitalized');
    });
    test('numbers', () => {
        expect(snakeCase('1before after2 bet3ween')).toBe('1before_after2_bet3ween');
        expect(snakeCase('50m3 1 2 3 numb3rs 8 3v3rywh3r3 9')).toBe('50m3_1_2_3_numb3rs_8_3v3rywh3r3_9');
        expect(snakeCase(snakeCase('50m3 1 2 3 numb3rs 8 3v3rywh3r3 9'))).toBe('50m3_1_2_3_numb3rs_8_3v3rywh3r3_9');
    });
    test('special characters', () => {
        expect(snakeCase('some::special\\\\chars+++in=between')).toBe('some_special_chars_in_between');
        expect(snakeCase('$peçia!::ch*rs')).toBe('pe_ia_ch_rs');
        expect(snakeCase('multiple.........dots')).toBe('multiple_dots');
        expect(snakeCase('multiple---------dashes')).toBe('multiple_dashes');
        expect(snakeCase('multiple_________underscores')).toBe('multiple_underscores');
    });
    test('from snake case', () => {
        expect(snakeCase('from_lowercased_snake_case')).toBe('from_lowercased_snake_case');
        expect(snakeCase('From_Capitalized_Snake_Case')).toBe('from_capitalized_snake_case');
        expect(snakeCase('FROM_UPPERCASED_SNAKE_CASE')).toBe('f_r_o_m_u_p_p_e_r_c_a_s_e_d_s_n_a_k_e_c_a_s_e');
        expect(snakeCase('fr0m_5nak3_c4s3_w1th_42n_numb3r5')).toBe('fr0m_5nak3_c4s3_w1th_42n_numb3r5');
        expect(snakeCase('frøm_snake_case_w:th_$peçia!_ch*rs')).toBe('fr_m_snake_case_w_th_pe_ia_ch_rs');
        expect(snakeCase(snakeCase('frøm_d0ubl3_Snake_c*se'))).toBe('fr_m_d0ubl3_snake_c_se');
    });
    test('from title case', () => {
        expect(snakeCase('from lowercased title case')).toBe('from_lowercased_title_case');
        expect(snakeCase('From Capitalized Title Case')).toBe('from_capitalized_title_case');
        expect(snakeCase('FROM UPPERCASED TITLE CASE')).toBe('f_r_o_m_u_p_p_e_r_c_a_s_e_d_t_i_t_l_e_c_a_s_e');
        expect(snakeCase('Fr0m T1tl3 C4s3 W1th 42n Numb3r5')).toBe('fr0m_t1tl3_c4s3_w1th_42n_numb3r5');
        expect(snakeCase('Frøm Title Case W:th $peçia! Ch*rs')).toBe('fr_m_title_case_w_th_pe_ia_ch_rs');
        expect(snakeCase(snakeCase('Frøm D0ubl3 Title C*se'))).toBe('fr_m_d0ubl3_title_c_se');
    });
    test('from pascal case', () => {
        expect(snakeCase('FromPascaleCase')).toBe('from_pascale_case');
        expect(snakeCase('Fr0mP45c4l3C4s3W1th42nNumb3r5')).toBe('fr0m_p45c4l3_c4s3_w1th42n_numb3r5');
        expect(snakeCase('FrømPascaleCaseW:th$peçia!Ch*rs')).toBe('fr_m_pascale_case_w_th_pe_ia_ch_rs');
        expect(snakeCase(snakeCase('FrømD0ubl3PascaleC*se'))).toBe('fr_m_d0ubl3_pascale_c_se');
    });
    test('from camel case', () => {
        expect(snakeCase('FromCamelCase')).toBe('from_camel_case');
        expect(snakeCase('Fr0mC4m3lC4s3W1th42nNumb3r5')).toBe('fr0m_c4m3l_c4s3_w1th42n_numb3r5');
        expect(snakeCase('FrømCamelCaseW:th$peçia!Ch*rs')).toBe('fr_m_camel_case_w_th_pe_ia_ch_rs');
        expect(snakeCase(snakeCase('FrømD0ubl3CamelC*se'))).toBe('fr_m_d0ubl3_camel_c_se');
    });
    test('from paths', () => {
        expect(snakeCase('crate::my_module::my_type')).toBe('crate_my_module_my_type');
        expect(snakeCase('/Users/username/My File.txt')).toBe('users_username_my_file_txt');
        expect(snakeCase('C:\\Users\\username\\My\\ File.txt')).toBe('c_users_username_my_file_txt');
    });
});

describe('titleCase', () => {
    test('casing', () => {
        expect(titleCase('lowercased')).toBe('Lowercased');
        expect(titleCase('UPPERCASED')).toBe('U P P E R C A S E D');
        expect(titleCase('Capitalized')).toBe('Capitalized');
    });
    test('numbers', () => {
        expect(titleCase('1before after2 bet3ween')).toBe('1before After2 Bet3ween');
        expect(titleCase('50m3 1 2 3 numb3rs 8 3v3rywh3r3 9')).toBe('50m3 1 2 3 Numb3rs 8 3v3rywh3r3 9');
        expect(titleCase(titleCase('50m3 1 2 3 numb3rs 8 3v3rywh3r3 9'))).toBe('50m3 1 2 3 Numb3rs 8 3v3rywh3r3 9');
    });
    test('special characters', () => {
        expect(titleCase('some::special\\\\chars+++in=between')).toBe('Some Special Chars In Between');
        expect(titleCase('$peçia!::ch*rs')).toBe('Pe Ia Ch Rs');
        expect(titleCase('multiple.........dots')).toBe('Multiple Dots');
        expect(titleCase('multiple---------dashes')).toBe('Multiple Dashes');
        expect(titleCase('multiple_________underscores')).toBe('Multiple Underscores');
    });
    test('from snake case', () => {
        expect(titleCase('from_lowercased_snake_case')).toBe('From Lowercased Snake Case');
        expect(titleCase('From_Capitalized_Snake_Case')).toBe('From Capitalized Snake Case');
        expect(titleCase('FROM_UPPERCASED_SNAKE_CASE')).toBe('F R O M U P P E R C A S E D S N A K E C A S E');
        expect(titleCase('fr0m_5nak3_c4s3_w1th_42n_numb3r5')).toBe('Fr0m 5nak3 C4s3 W1th 42n Numb3r5');
        expect(titleCase('frøm_snake_case_w:th_$peçia!_ch*rs')).toBe('Fr M Snake Case W Th Pe Ia Ch Rs');
        expect(titleCase(titleCase('frøm_d0ubl3_Snake_c*se'))).toBe('Fr M D0ubl3 Snake C Se');
    });
    test('from title case', () => {
        expect(titleCase('from lowercased title case')).toBe('From Lowercased Title Case');
        expect(titleCase('From Capitalized Title Case')).toBe('From Capitalized Title Case');
        expect(titleCase('FROM UPPERCASED TITLE CASE')).toBe('F R O M U P P E R C A S E D T I T L E C A S E');
        expect(titleCase('Fr0m T1tl3 C4s3 W1th 42n Numb3r5')).toBe('Fr0m T1tl3 C4s3 W1th 42n Numb3r5');
        expect(titleCase('Frøm Title Case W:th $peçia! Ch*rs')).toBe('Fr M Title Case W Th Pe Ia Ch Rs');
        expect(titleCase(titleCase('Frøm D0ubl3 Title C*se'))).toBe('Fr M D0ubl3 Title C Se');
    });
    test('from pascal case', () => {
        expect(titleCase('FromPascaleCase')).toBe('From Pascale Case');
        expect(titleCase('Fr0mP45c4l3C4s3W1th42nNumb3r5')).toBe('Fr0m P45c4l3 C4s3 W1th42n Numb3r5');
        expect(titleCase('FrømPascaleCaseW:th$peçia!Ch*rs')).toBe('Fr M Pascale Case W Th Pe Ia Ch Rs');
        expect(titleCase(titleCase('FrømD0ubl3PascaleC*se'))).toBe('Fr M D0ubl3 Pascale C Se');
    });
    test('from camel case', () => {
        expect(titleCase('FromCamelCase')).toBe('From Camel Case');
        expect(titleCase('Fr0mC4m3lC4s3W1th42nNumb3r5')).toBe('Fr0m C4m3l C4s3 W1th42n Numb3r5');
        expect(titleCase('FrømCamelCaseW:th$peçia!Ch*rs')).toBe('Fr M Camel Case W Th Pe Ia Ch Rs');
        expect(titleCase(titleCase('FrømD0ubl3CamelC*se'))).toBe('Fr M D0ubl3 Camel C Se');
    });
    test('from paths', () => {
        expect(titleCase('crate::my_module::my_type')).toBe('Crate My Module My Type');
        expect(titleCase('/Users/username/My File.txt')).toBe('Users Username My File Txt');
        expect(titleCase('C:\\Users\\username\\My\\ File.txt')).toBe('C Users Username My File Txt');
    });
});

describe('camelCase', () => {
    test('casing', () => {
        expect(camelCase('lowercased')).toBe('lowercased');
        expect(camelCase('UPPERCASED')).toBe('uPPERCASED');
        expect(camelCase('Capitalized')).toBe('capitalized');
    });
    test('numbers', () => {
        expect(camelCase('1before after2 bet3ween')).toBe('1beforeAfter2Bet3ween');
        expect(camelCase('50m3 1 2 3 numb3rs 8 3v3rywh3r3 9')).toBe('50m3123Numb3rs83v3rywh3r39');
        expect(titleCase(camelCase('50m3 1 2 3 numb3rs 8 3v3rywh3r3 9'))).toBe('50m3123 Numb3rs83v3rywh3r39');
    });
    test('special characters', () => {
        expect(camelCase('some::special\\\\chars+++in=between')).toBe('someSpecialCharsInBetween');
        expect(camelCase('$peçia!::ch*rs')).toBe('peIaChRs');
        expect(camelCase('multiple.........dots')).toBe('multipleDots');
        expect(camelCase('multiple---------dashes')).toBe('multipleDashes');
        expect(camelCase('multiple_________underscores')).toBe('multipleUnderscores');
    });
    test('from snake case', () => {
        expect(camelCase('from_lowercased_snake_case')).toBe('fromLowercasedSnakeCase');
        expect(camelCase('From_Capitalized_Snake_Case')).toBe('fromCapitalizedSnakeCase');
        expect(camelCase('FROM_UPPERCASED_SNAKE_CASE')).toBe('fROMUPPERCASEDSNAKECASE');
        expect(camelCase('fr0m_5nak3_c4s3_w1th_42n_numb3r5')).toBe('fr0m5nak3C4s3W1th42nNumb3r5');
        expect(camelCase('frøm_snake_case_w:th_$peçia!_ch*rs')).toBe('frMSnakeCaseWThPeIaChRs');
        expect(camelCase(camelCase('frøm_d0ubl3_Snake_c*se'))).toBe('frMD0ubl3SnakeCSe');
    });
    test('from title case', () => {
        expect(camelCase('from lowercased title case')).toBe('fromLowercasedTitleCase');
        expect(camelCase('From Capitalized Title Case')).toBe('fromCapitalizedTitleCase');
        expect(camelCase('FROM UPPERCASED TITLE CASE')).toBe('fROMUPPERCASEDTITLECASE');
        expect(camelCase('Fr0m T1tl3 C4s3 W1th 42n Numb3r5')).toBe('fr0mT1tl3C4s3W1th42nNumb3r5');
        expect(camelCase('Frøm Title Case W:th $peçia! Ch*rs')).toBe('frMTitleCaseWThPeIaChRs');
        expect(camelCase(camelCase('Frøm D0ubl3 Title C*se'))).toBe('frMD0ubl3TitleCSe');
    });
    test('from pascal case', () => {
        expect(camelCase('FromPascaleCase')).toBe('fromPascaleCase');
        expect(camelCase('Fr0mP45c4l3C4s3W1th42nNumb3r5')).toBe('fr0mP45c4l3C4s3W1th42nNumb3r5');
        expect(camelCase('FrømPascaleCaseW:th$peçia!Ch*rs')).toBe('frMPascaleCaseWThPeIaChRs');
        expect(camelCase(camelCase('FrømD0ubl3PascaleC*se'))).toBe('frMD0ubl3PascaleCSe');
    });
    test('from camel case', () => {
        expect(camelCase('FromCamelCase')).toBe('fromCamelCase');
        expect(camelCase('Fr0mC4m3lC4s3W1th42nNumb3r5')).toBe('fr0mC4m3lC4s3W1th42nNumb3r5');
        expect(camelCase('FrømCamelCaseW:th$peçia!Ch*rs')).toBe('frMCamelCaseWThPeIaChRs');
        expect(camelCase(camelCase('FrømD0ubl3CamelC*se'))).toBe('frMD0ubl3CamelCSe');
    });
    test('from paths', () => {
        expect(camelCase('crate::my_module::my_type')).toBe('crateMyModuleMyType');
        expect(camelCase('/Users/username/My File.txt')).toBe('usersUsernameMyFileTxt');
        expect(camelCase('C:\\Users\\username\\My\\ File.txt')).toBe('cUsersUsernameMyFileTxt');
    });
});
