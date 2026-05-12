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

namespace UserModule_NVX_ROUTER
{
    public class UserModuleClass_NVX_ROUTER : SplusObject
    {
        static CCriticalSection g_criticalSection = new CCriticalSection();
        
        
        
        InOutArray<Crestron.Logos.SplusObjects.AnalogInput> SOURCE;
        InOutArray<Crestron.Logos.SplusObjects.StringInput> STREAMIN__DOLLAR__;
        InOutArray<Crestron.Logos.SplusObjects.StringOutput> ROUTE__DOLLAR__;
        object SOURCE_OnChange_0 ( Object __EventInfo__ )
        
            { 
            Crestron.Logos.SplusObjects.SignalEventArgs __SignalEventArg__ = (Crestron.Logos.SplusObjects.SignalEventArgs)__EventInfo__;
            try
            {
                SplusExecutionContext __context__ = SplusThreadStartCode(__SignalEventArg__);
                ushort O = 0;
                
                
                __context__.SourceCodeLine = 16;
                O = (ushort) ( Functions.GetLastModifiedArrayIndex( __SignalEventArg__ ) ) ; 
                __context__.SourceCodeLine = 17;
                ROUTE__DOLLAR__ [ O]  .UpdateValue ( STREAMIN__DOLLAR__ [ SOURCE[ O ] .UshortValue ]  ) ; 
                
                
            }
            catch(Exception e) { ObjectCatchHandler(e); }
            finally { ObjectFinallyHandler( __SignalEventArg__ ); }
            return this;
            
        }
        
    
    public override void LogosSplusInitialize()
    {
        _SplusNVRAM = new SplusNVRAM( this );
        
        SOURCE = new InOutArray<AnalogInput>( 8, this );
        for( uint i = 0; i < 8; i++ )
        {
            SOURCE[i+1] = new Crestron.Logos.SplusObjects.AnalogInput( SOURCE__AnalogSerialInput__ + i, SOURCE__AnalogSerialInput__, this );
            m_AnalogInputList.Add( SOURCE__AnalogSerialInput__ + i, SOURCE[i+1] );
        }
        
        STREAMIN__DOLLAR__ = new InOutArray<StringInput>( 16, this );
        for( uint i = 0; i < 16; i++ )
        {
            STREAMIN__DOLLAR__[i+1] = new Crestron.Logos.SplusObjects.StringInput( STREAMIN__DOLLAR____AnalogSerialInput__ + i, STREAMIN__DOLLAR____AnalogSerialInput__, 50, this );
            m_StringInputList.Add( STREAMIN__DOLLAR____AnalogSerialInput__ + i, STREAMIN__DOLLAR__[i+1] );
        }
        
        ROUTE__DOLLAR__ = new InOutArray<StringOutput>( 8, this );
        for( uint i = 0; i < 8; i++ )
        {
            ROUTE__DOLLAR__[i+1] = new Crestron.Logos.SplusObjects.StringOutput( ROUTE__DOLLAR____AnalogSerialOutput__ + i, this );
            m_StringOutputList.Add( ROUTE__DOLLAR____AnalogSerialOutput__ + i, ROUTE__DOLLAR__[i+1] );
        }
        
        
        for( uint i = 0; i < 8; i++ )
            SOURCE[i+1].OnAnalogChange.Add( new InputChangeHandlerWrapper( SOURCE_OnChange_0, false ) );
            
        
        _SplusNVRAM.PopulateCustomAttributeList( true );
        
        NVRAM = _SplusNVRAM;
        
    }
    
    public override void LogosSimplSharpInitialize()
    {
        
        
    }
    
    public UserModuleClass_NVX_ROUTER ( string InstanceName, string ReferenceID, Crestron.Logos.SplusObjects.CrestronStringEncoding nEncodingType ) : base( InstanceName, ReferenceID, nEncodingType ) {}
    
    
    
    
    const uint SOURCE__AnalogSerialInput__ = 0;
    const uint STREAMIN__DOLLAR____AnalogSerialInput__ = 8;
    const uint ROUTE__DOLLAR____AnalogSerialOutput__ = 0;
    
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
