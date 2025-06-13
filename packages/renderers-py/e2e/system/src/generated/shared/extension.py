"""Extensions to the Borsh spec for Solana-specific types."""
from os import environ
from typing import Any,cast
import io

import borsh_construct as borsh
from typing import Any, Dict, Type, TypeVar, cast,List,Tuple
from construct import (
    Adapter,
    Construct,
    GreedyBytes,
    PaddedString,
    Padded,
    Padding,
    Prefixed,
    Renamed,
    Switch,
    IfThenElse,
    PrefixedArray,
    Optional,
    Struct,
    Pointer,
    evaluate,
    stream_tell,
    stream_seek,
)
from typing import T

U64Bytes = Prefixed(borsh.U64, GreedyBytes)
U8Bytes = Prefixed(borsh.U8, GreedyBytes)

class _String64(Adapter):
    def __init__(self) -> None:
        super().__init__(U64Bytes)  # type: ignore

    def _decode(self, obj: bytes, context, path) -> str:
        return obj.decode("utf8")

    def _encode(self, obj: str, context, path) -> bytes:
        return bytes(obj, "utf8")
class _String8(Adapter):
    def __init__(self) -> None:
        super().__init__(GreedyBytes)  # type: ignore

    def _decode(self, obj: bytes, context, path) -> str:
        return obj.decode("utf8")

    def _encode(self, obj: str, context, path) -> bytes:
        #print("Encoding string:", obj)
        #return bytes(obj.encode("utf8"))
        return bytes([ord(obj)]) #bytes(bytes([ord(obj)]), "utf8")

String64=_String64()
String8=_String8()


class HiddenPrefixAdapter(Adapter):
    #prefix = None
    def __init__(self,padding: borsh.TupleStruct,subcon: Construct):
        #self.prefix = padding
        prefix_struct = borsh.CStruct(
            "prefix"/padding,
            "data"/subcon,
        )
        super().__init__(prefix_struct)

    def _decode(self, obj, context, path) -> Any:
        return obj["data"]

    def _encode(self, obj, context, path) -> Any:
        return {"data": obj}

class HiddenSuffixAdapter(Adapter):
    suffix = None
    def __init__(self,padding,subcon: Construct):
        self.suffix = padding
        suffix_struct = borsh.CStruct(
            "suffix"/borsh.U8[len(padding)],
            "data"/subcon,
        )
        super().__init__(suffix_struct)

    def _decode(self, obj, context, path) -> Any:
        return obj["data"]

    def _encode(self, obj, context, path) -> dict:
        return { "data": obj, "suffix": self.suffix}

class OptionU32(Adapter):
    _discriminator_key = "discriminator"
    _value_key = "value"

    def __init__(self, subcon: Construct) -> None:
        option_struct = borsh.CStruct(
            self._discriminator_key / borsh.U32,
            self._value_key
            / IfThenElse(
                lambda this: this[self._discriminator_key] == 0,
                Padding(subcon.sizeof()),
                subcon,
            ),
        )
        super().__init__(option_struct)  # type: ignore

    def _decode(self, obj, context, path) -> Any:
        discriminator = obj[self._discriminator_key]
        return None if discriminator == 0 else obj[self._value_key]

    def _encode(self, obj, context, path) -> dict:
        discriminator = 0 if obj is None else 1
        return {self._discriminator_key: discriminator, self._value_key: obj}


RemainderOption=Optional

class EnumForCodegenU16(Adapter):
    _index_key = "index"
    _value_key = "value"

    def __init__(self, *variants: "Renamed[borsh.CStruct, borsh.CStruct]") -> None:
        """Init enum."""
        switch_cases: dict[int, "Renamed[borsh.CStruct, borsh.CStruct]"] = {}
        variant_name_to_index: dict[str, int] = {}
        index_to_variant_name: dict[int, str] = {}
        for idx, parser in enumerate(variants):
            switch_cases[idx] = parser
            name = cast(str, parser.name)
            variant_name_to_index[name] = idx
            index_to_variant_name[idx] = name
        enum_struct = borsh.CStruct(
            self._index_key /borsh.U16,
            self._value_key
            / Switch(lambda this: this.index, cast(dict[int, Construct], switch_cases)),
        )
        super().__init__(enum_struct)  # type: ignore
        self.variant_name_to_index = variant_name_to_index
        self.index_to_variant_name = index_to_variant_name

    def _decode(self, obj: borsh.CStruct, context, path) -> dict[str, Any]:
        index = obj.index
        variant_name = self.index_to_variant_name[index]
        return {variant_name: obj.value}

    def _encode(self, obj: dict[str, Any], context, path) -> dict[str, Any]:
        variant_name = list(obj.keys())[0]
        index = self.variant_name_to_index[variant_name]
        return {self._index_key: index, self._value_key: obj[variant_name]}


class EnumForCodegenU32(Adapter):
    _index_key = "index"
    _value_key = "value"

    def __init__(self, *variants: "Renamed[borsh.CStruct, borsh.CStruct]") -> None:
        """Init enum."""
        switch_cases: dict[int, "Renamed[borsh.CStruct, borsh.CStruct]"] = {}
        variant_name_to_index: dict[str, int] = {}
        index_to_variant_name: dict[int, str] = {}
        for idx, parser in enumerate(variants):
            switch_cases[idx] = parser
            name = cast(str, parser.name)
            variant_name_to_index[name] = idx
            index_to_variant_name[idx] = name
        enum_struct = borsh.CStruct(
            self._index_key /borsh.U32,
            self._value_key
            / Switch(lambda this: this.index, cast(dict[int, Construct], switch_cases)),
        )
        super().__init__(enum_struct)  # type: ignore
        self.variant_name_to_index = variant_name_to_index
        self.index_to_variant_name = index_to_variant_name

    def _decode(self, obj: borsh.CStruct, context, path) -> dict[str, Any]:
        index = obj.index
        variant_name = self.index_to_variant_name[index]
        return {variant_name: obj.value}

    def _encode(self, obj: dict[str, Any], context, path) -> dict[str, Any]:
        variant_name = list(obj.keys())[0]
        index = self.variant_name_to_index[variant_name]
        return {self._index_key: index, self._value_key: obj[variant_name]}

FixedSizeString=PaddedString
FixedSizeBytes=Padded

class SolMapU32(Adapter):
    """Borsh implementation for Rust HashMap."""

    def __init__(self, key_subcon: Construct, value_subcon: Construct) -> None:
        super().__init__(
            PrefixedArray(borsh.U32, borsh.TupleStruct(key_subcon, value_subcon)),
        )  # type: ignore

    def _decode(self, obj:List[Tuple[Any, Any]], context, path) -> dict:
        #print("decode",obj)
        return dict(obj)

    def _encode(self, obj, context, path) ->  List[Tuple]:  #Tuple[Any,List[Tuple[Any, Any]]]:
        print("encode",obj)
        return obj.items()

class PreOffset(Adapter):
    def __init__(self, subcon: Construct,offset: int) -> None:
        super().__init__(Pointer(offset,subcon))

    def _decode(self, obj:Any, context, path) -> Any:
        #print("decode",obj)
        return obj

    def _encode(self, obj, context, path) ->  Any:  #Tuple[Any,List[Tuple[Any, Any]]]:
    #    print("encode",obj)
        return obj
def generate_zero_bytes(offsite_count):
    return b'\x00' * offsite_count
class PostOffset(Pointer):
    def __init__(self, subcon: Construct,offset: int) -> None:
        super().__init__(offset,subcon)
    def _parse(self, stream, context, path):
        offset = evaluate(self.offset, context)
        stream = evaluate(self.stream, context) or stream
        fallback = stream_tell(stream, path)
        #print("_parse",offset)
        #print("stream",stream)
        stream2 = io.BytesIO()
        #print(self.subcon.length)
        stream2.write(stream.read(self.subcon.length+ offset))
        if offset<0:
            stream2.write(generate_zero_bytes(abs(offset)))
        stream2.seek(0, 0)
        obj = self.subcon._parsereport(stream2, context, path)
        stream_seek(stream, self.subcon.length+ offset, 0, path)
        return obj

    def _build(self, obj, stream, context, path):
        offset = evaluate(self.offset, context)
        stream = evaluate(self.stream, context) or stream
        fallback = stream_tell(stream, path)
        #print("_build",offset)
        #print("_build fallback",fallback)
        buildret = self.subcon._build(obj, stream, context, path)
        if offset>0:
            stream_seek(stream, self.subcon.length+offset, 2 if offset < 0 else 0, path)
        else:
            stream_seek(stream, offset, 2 if offset < 0 else 0, path)
        #stream_seek(stream, fallback, 0, path)
        return buildret


class ZeroableOption(Adapter):
    def __init__(self, subcon: Construct,value: Any) -> None:
        self.value = value
        super().__init__(subcon)
    def _decode(self, obj:Any, context, path) -> Any:
        if obj == self.value:
            return None
        return obj

    def _encode(self, obj, context, path) ->  Any:
        if obj == self.value:
            return obj
        return obj

SizePrefix=Prefixed
