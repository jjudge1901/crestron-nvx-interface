using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Linq;
using Crestron;
using Crestron.Logos.SplusLibrary;
using Crestron.Logos.SplusObjects;
using Crestron.SimplSharp;

namespace UserModule_ROOMVIEW_ERROR_STATUS_USP
{
    public class UserModuleClass_ROOMVIEW_ERROR_STATUS_USP : SplusObject
    {
        static CCriticalSection g_criticalSection = new CCriticalSection();
        
        
        InOutArray<Crestron.Logos.SplusObjects.DigitalInput> ERROR;
        InOutArray<Crestron.Logos.SplusObjects.StringInput> ERRORTEXT;
        Crestron.Logos.SplusObjects.StringOutput STATUS;
        private void REFRESH (  SplusExecutionContext __context__ ) 
            { 
            ushort I = 0;
            ushort COUNT = 0;
            ushort [] ERRORS;
            ERRORS  = new ushort[ 51 ];
            
            CrestronString CAT;
            CAT  = new CrestronString( Crestron.Logos.SplusObjects.CrestronStringEncoding.eEncodingASCII, 200, this );
            
            
            __context__.SourceCodeLine = 53;
            COUNT = (ushort) ( 0 ) ; 
            __context__.SourceCodeLine = 54;
            ushort __FN_FORSTART_VAL__1 = (ushort) ( 1 ) ;
            ushort __FN_FOREND_VAL__1 = (ushort)50; 
            int __FN_FORSTEP_VAL__1 = (int)1; 
            for ( I  = __FN_FORSTART_VAL__1; (__FN_FORSTEP_VAL__1 > 0)  ? ( (I  >= __FN_FORSTART_VAL__1) && (I  <= __FN_FOREND_VAL__1) ) : ( (I  <= __FN_FORSTART_VAL__1) && (I  >= __FN_FOREND_VAL__1) ) ; I  += (ushort)__FN_FORSTEP_VAL__1) 
                { 
                __context__.SourceCodeLine = 55;
                if ( Functions.TestForTrue  ( ( Functions.BoolToInt ( (Functions.TestForTrue ( IsSignalDefined( ERROR[ I ] ) ) && Functions.TestForTrue ( ERROR[ I ] .Value )) ))  ) ) 
                    { 
                    __context__.SourceCodeLine = 55;
                    COUNT = (ushort) ( (COUNT + 1) ) ; 
                    __context__.SourceCodeLine = 55;
                    ERRORS [ COUNT] = (ushort) ( I ) ; 
                    } 
                
                __context__.SourceCodeLine = 54;
                } 
            
            __context__.SourceCodeLine = 57;
            if ( Functions.TestForTrue  ( ( Functions.BoolToInt (COUNT == 0))  ) ) 
                { 
                __context__.SourceCodeLine = 58;
                STATUS  .UpdateValue ( "0:OK"  ) ; 
                } 
            
            else 
                {
                __context__.SourceCodeLine = 59;
                if ( Functions.TestForTrue  ( ( Functions.BoolToInt (COUNT == 1))  ) ) 
                    { 
                    __context__.SourceCodeLine = 60;
                    STATUS  .UpdateValue ( "4:" + ERRORTEXT [ ERRORS[ 1 ] ]  ) ; 
                    } 
                
                else 
                    { 
                    __context__.SourceCodeLine = 62;
                    CAT  .UpdateValue ( ERRORTEXT [ ERRORS[ 1 ] ]  ) ; 
                    __context__.SourceCodeLine = 63;
                    ushort __FN_FORSTART_VAL__2 = (ushort) ( 2 ) ;
                    ushort __FN_FOREND_VAL__2 = (ushort)COUNT; 
                    int __FN_FORSTEP_VAL__2 = (int)1; 
                    for ( I  = __FN_FORSTART_VAL__2; (__FN_FORSTEP_VAL__2 > 0)  ? ( (I  >= __FN_FORSTART_VAL__2) && (I  <= __FN_FOREND_VAL__2) ) : ( (I  <= __FN_FORSTART_VAL__2) && (I  >= __FN_FOREND_VAL__2) ) ; I  += (ushort)__FN_FORSTEP_VAL__2) 
                        { 
                        __context__.SourceCodeLine = 64;
                        CAT  .UpdateValue ( CAT + ", " + ERRORTEXT [ ERRORS[ I ] ]  ) ; 
                        __context__.SourceCodeLine = 63;
                        } 
                    
                    __context__.SourceCodeLine = 66;
                    MakeString ( STATUS , "4:{0:d} errors -- {1}", (short)COUNT, CAT ) ; 
                    } 
                
                }
            
            
            }
            
        object ERROR_OnPush_0 ( Object __EventInfo__ )
        
            { 
            Crestron.Logos.SplusObjects.SignalEventArgs __SignalEventArg__ = (Crestron.Logos.SplusObjects.SignalEventArgs)__EventInfo__;
            try
            {
                SplusExecutionContext __context__ = SplusThreadStartCode(__SignalEventArg__);
                
                __context__.SourceCodeLine = 70;
                REFRESH (  __context__  ) ; 
                
                
            }
            catch(Exception e) { ObjectCatchHandler(e); }
            finally { ObjectFinallyHandler( __SignalEventArg__ ); }
            return this;
            
        }
        
    object ERROR_OnRelease_1 ( Object __EventInfo__ )
    
        { 
        Crestron.Logos.SplusObjects.SignalEventArgs __SignalEventArg__ = (Crestron.Logos.SplusObjects.SignalEventArgs)__EventInfo__;
        try
        {
            SplusExecutionContext __context__ = SplusThreadStartCode(__SignalEventArg__);
            
            __context__.SourceCodeLine = 71;
            REFRESH (  __context__  ) ; 
            
            
        }
        catch(Exception e) { ObjectCatchHandler(e); }
        finally { ObjectFinallyHandler( __SignalEventArg__ ); }
        return this;
        
    }
    
public override object FunctionMain (  object __obj__ ) 
    { 
    try
    {
        SplusExecutionContext __context__ = SplusFunctionMainStartCode();
        
        __context__.SourceCodeLine = 74;
        WaitForInitializationComplete ( ) ; 
        __context__.SourceCodeLine = 75;
        while ( Functions.TestForTrue  ( ( 1)  ) ) 
            { 
            __context__.SourceCodeLine = 76;
            REFRESH (  __context__  ) ; 
            __context__.SourceCodeLine = 77;
            Functions.Delay (  (int) ( 10000 ) ) ; 
            __context__.SourceCodeLine = 75;
            } 
        
        
        
    }
    catch(Exception e) { ObjectCatchHandler(e); }
    finally { ObjectFinallyHandler(); }
    return __obj__;
    }
    

public override void LogosSplusInitialize()
{
    SocketInfo __socketinfo__ = new SocketInfo( 1, this );
    InitialParametersClass.ResolveHostName = __socketinfo__.ResolveHostName;
    _SplusNVRAM = new SplusNVRAM( this );
    
    ERROR = new InOutArray<DigitalInput>( 50, this );
    for( uint i = 0; i < 50; i++ )
    {
        ERROR[i+1] = new Crestron.Logos.SplusObjects.DigitalInput( ERROR__DigitalInput__ + i, ERROR__DigitalInput__, this );
        m_DigitalInputList.Add( ERROR__DigitalInput__ + i, ERROR[i+1] );
    }
    
    ERRORTEXT = new InOutArray<StringInput>( 50, this );
    for( uint i = 0; i < 50; i++ )
    {
        ERRORTEXT[i+1] = new Crestron.Logos.SplusObjects.StringInput( ERRORTEXT__AnalogSerialInput__ + i, ERRORTEXT__AnalogSerialInput__, 200, this );
        m_StringInputList.Add( ERRORTEXT__AnalogSerialInput__ + i, ERRORTEXT[i+1] );
    }
    
    STATUS = new Crestron.Logos.SplusObjects.StringOutput( STATUS__AnalogSerialOutput__, this );
    m_StringOutputList.Add( STATUS__AnalogSerialOutput__, STATUS );
    
    
    for( uint i = 0; i < 50; i++ )
        ERROR[i+1].OnDigitalPush.Add( new InputChangeHandlerWrapper( ERROR_OnPush_0, false ) );
        
    for( uint i = 0; i < 50; i++ )
        ERROR[i+1].OnDigitalRelease.Add( new InputChangeHandlerWrapper( ERROR_OnRelease_1, false ) );
        
    
    _SplusNVRAM.PopulateCustomAttributeList( true );
    
    NVRAM = _SplusNVRAM;
    
}

public override void LogosSimplSharpInitialize()
{
    
    
}

public UserModuleClass_ROOMVIEW_ERROR_STATUS_USP ( string InstanceName, string ReferenceID, Crestron.Logos.SplusObjects.CrestronStringEncoding nEncodingType ) : base( InstanceName, ReferenceID, nEncodingType ) {}




const uint ERROR__DigitalInput__ = 0;
const uint ERRORTEXT__AnalogSerialInput__ = 0;
const uint STATUS__AnalogSerialOutput__ = 0;

[SplusStructAttribute(-1, true, false)]
public class SplusNVRAM : SplusStructureBase
{

    public SplusNVRAM( SplusObject __caller__ ) : base( __caller__ ) {}
    
    
}

SplusNVRAM _SplusNVRAM = null;

public class __CEvent__ : CEvent
{
    public __CEvent__() {}
    public void Close() { base.Close(); }
    public int Reset() { return base.Reset() ? 1 : 0; }
    public int Set() { return base.Set() ? 1 : 0; }
    public int Wait( int timeOutInMs ) { return base.Wait( timeOutInMs ) ? 1 : 0; }
}
public class __CMutex__ : CMutex
{
    public __CMutex__() {}
    public void Close() { base.Close(); }
    public void ReleaseMutex() { base.ReleaseMutex(); }
    public int WaitForMutex() { return base.WaitForMutex() ? 1 : 0; }
}
 public int IsNull( object obj ){ return (obj == null) ? 1 : 0; }
}


}
