/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama/codama
 */

import {
  addDecoderSizePrefix,
  addEncoderSizePrefix,
  combineCodec,
  getOptionDecoder,
  getOptionEncoder,
  getStructDecoder,
  getStructEncoder,
  getU32Decoder,
  getU32Encoder,
  getUtf8Decoder,
  getUtf8Encoder,
  type Codec,
  type Decoder,
  type Encoder,
  type Option,
  type OptionOrNullable,
} from '@solana/web3.js';
import {
  getMetadataAdditionalFieldRestrictionDecoder,
  getMetadataAdditionalFieldRestrictionEncoder,
  type MetadataAdditionalFieldRestriction,
  type MetadataAdditionalFieldRestrictionArgs,
} from '.';

/**
 * Enforces rules on a single additional field in the mint metadata.
 * The field must exist and the value must pass the restriction.
 */

export type MetadataAdditionalFieldRule = {
  field: string;
  valueRestrictions: Option<MetadataAdditionalFieldRestriction>;
};

export type MetadataAdditionalFieldRuleArgs = {
  field: string;
  valueRestrictions: OptionOrNullable<MetadataAdditionalFieldRestrictionArgs>;
};

export function getMetadataAdditionalFieldRuleEncoder(): Encoder<MetadataAdditionalFieldRuleArgs> {
  return getStructEncoder([
    ['field', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
    [
      'valueRestrictions',
      getOptionEncoder(getMetadataAdditionalFieldRestrictionEncoder()),
    ],
  ]);
}

export function getMetadataAdditionalFieldRuleDecoder(): Decoder<MetadataAdditionalFieldRule> {
  return getStructDecoder([
    ['field', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
    [
      'valueRestrictions',
      getOptionDecoder(getMetadataAdditionalFieldRestrictionDecoder()),
    ],
  ]);
}

export function getMetadataAdditionalFieldRuleCodec(): Codec<
  MetadataAdditionalFieldRuleArgs,
  MetadataAdditionalFieldRule
> {
  return combineCodec(
    getMetadataAdditionalFieldRuleEncoder(),
    getMetadataAdditionalFieldRuleDecoder()
  );
}
