using System;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CriticalAssetSimulator.Enums;

/// <summary>
/// Security / classification level (MVP version)
/// </summary>
public enum ClassificationLevel
{
    UNCLASSIFIED,
    RESTRICTED,
    CONFIDENTIAL
}