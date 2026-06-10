export const BPMN_TEMPLATES: Record<string, string> = {
  credito: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_credito" targetNamespace="http://zflow.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="Trámite de Crédito" processRef="Process_Credito" />
  </bpmn:collaboration>
  <bpmn:process id="Process_Credito" isExecutable="true">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Solicitar</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Analista" name="Analista de crédito">
        <bpmn:flowNodeRef>Task_Evaluar</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Directora" name="Directora">
        <bpmn:flowNodeRef>Task_Aprobar</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_1</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Inicio">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_Solicitar" name="Solicitar Crédito">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Evaluar" name="Evaluar Crédito">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Aprobar" name="Aprobar Crédito">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Fin">
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_Solicitar" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Solicitar" targetRef="Task_Evaluar" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_Evaluar" targetRef="Task_Aprobar" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_Aprobar" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="100" y="50" width="600" height="370" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true">
        <dc:Bounds x="130" y="50" width="570" height="120" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Analista_di" bpmnElement="Lane_Analista" isHorizontal="true">
        <dc:Bounds x="130" y="170" width="570" height="120" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Directora_di" bpmnElement="Lane_Directora" isHorizontal="true">
        <dc:Bounds x="130" y="290" width="570" height="130" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="90" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Solicitar_di" bpmnElement="Task_Solicitar">
        <dc:Bounds x="260" y="70" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Evaluar_di" bpmnElement="Task_Evaluar">
        <dc:Bounds x="390" y="190" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Aprobar_di" bpmnElement="Task_Aprobar">
        <dc:Bounds x="520" y="310" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="640" y="330" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="216" y="108" />
        <di:waypoint x="260" y="108" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="360" y="110" />
        <di:waypoint x="375" y="110" />
        <di:waypoint x="375" y="230" />
        <di:waypoint x="390" y="230" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="490" y="230" />
        <di:waypoint x="505" y="230" />
        <di:waypoint x="505" y="350" />
        <di:waypoint x="520" y="350" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="620" y="350" />
        <di:waypoint x="640" y="350" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,

  cuenta: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DI" id="Definitions_cuenta" targetNamespace="http://zflow.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="Apertura de Cuenta" processRef="Process_Cuenta" />
  </bpmn:collaboration>
  <bpmn:process id="Process_Cuenta" isExecutable="true">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Solicitar</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Cajero" name="Cajero">
        <bpmn:flowNodeRef>Task_Verificar</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Gerente" name="Gerente">
        <bpmn:flowNodeRef>Task_Autorizar</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_1</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Inicio">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_Solicitar" name="Solicitar Cuenta">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Verificar" name="Verificar Datos">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Autorizar" name="Autorizar Apertura">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Fin">
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_Solicitar" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Solicitar" targetRef="Task_Verificar" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_Verificar" targetRef="Task_Autorizar" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_Autorizar" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="100" y="50" width="600" height="370" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true">
        <dc:Bounds x="130" y="50" width="570" height="120" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cajero_di" bpmnElement="Lane_Cajero" isHorizontal="true">
        <dc:Bounds x="130" y="170" width="570" height="120" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Gerente_di" bpmnElement="Lane_Gerente" isHorizontal="true">
        <dc:Bounds x="130" y="290" width="570" height="130" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="90" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Solicitar_di" bpmnElement="Task_Solicitar">
        <dc:Bounds x="260" y="70" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Verificar_di" bpmnElement="Task_Verificar">
        <dc:Bounds x="390" y="190" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Autorizar_di" bpmnElement="Task_Autorizar">
        <dc:Bounds x="520" y="310" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="640" y="330" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="216" y="108" />
        <di:waypoint x="260" y="108" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="360" y="110" />
        <di:waypoint x="375" y="110" />
        <di:waypoint x="375" y="230" />
        <di:waypoint x="390" y="230" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="490" y="230" />
        <di:waypoint x="505" y="230" />
        <di:waypoint x="505" y="350" />
        <di:waypoint x="520" y="350" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="620" y="350" />
        <di:waypoint x="640" y="350" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,

  vacaciones: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DI" id="Definitions_vacaciones" targetNamespace="http://zflow.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="Solicitud de Vacaciones" processRef="Process_Vacaciones" />
  </bpmn:collaboration>
  <bpmn:process id="Process_Vacaciones" isExecutable="true">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Cliente" name="Cliente">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Solicitar</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_RH" name="Recursos Humanos">
        <bpmn:flowNodeRef>Task_Validar</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Jefe" name="Jefe">
        <bpmn:flowNodeRef>Task_Aprobar</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_1</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Inicio">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_Solicitar" name="Solicitar Vacaciones">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Validar" name="Validar Días">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Aprobar" name="Aprobar Vacaciones">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Fin">
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_Solicitar" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Solicitar" targetRef="Task_Validar" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_Validar" targetRef="Task_Aprobar" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_Aprobar" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="100" y="50" width="600" height="370" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Cliente_di" bpmnElement="Lane_Cliente" isHorizontal="true">
        <dc:Bounds x="130" y="50" width="570" height="120" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_RH_di" bpmnElement="Lane_RH" isHorizontal="true">
        <dc:Bounds x="130" y="170" width="570" height="120" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Jefe_di" bpmnElement="Lane_Jefe" isHorizontal="true">
        <dc:Bounds x="130" y="290" width="570" height="130" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="90" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Solicitar_di" bpmnElement="Task_Solicitar">
        <dc:Bounds x="260" y="70" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Validar_di" bpmnElement="Task_Validar">
        <dc:Bounds x="390" y="190" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Aprobar_di" bpmnElement="Task_Aprobar">
        <dc:Bounds x="520" y="310" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="640" y="330" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="216" y="108" />
        <di:waypoint x="260" y="108" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="360" y="110" />
        <di:waypoint x="375" y="110" />
        <di:waypoint x="375" y="230" />
        <di:waypoint x="390" y="230" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="490" y="230" />
        <di:waypoint x="505" y="230" />
        <di:waypoint x="505" y="350" />
        <di:waypoint x="520" y="350" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="620" y="350" />
        <di:waypoint x="640" y="350" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,

  onboarding: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DI" id="Definitions_onboarding" targetNamespace="http://zflow.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="Onboarding Funcionario" processRef="Process_Onboarding" />
  </bpmn:collaboration>
  <bpmn:process id="Process_Onboarding" isExecutable="true">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_RH" name="Recursos Humanos">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Preparar</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Funcionario" name="Funcionario">
        <bpmn:flowNodeRef>Task_Firmar</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Induccion</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_1</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Inicio">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_Preparar" name="Preparar Contrato">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Firmar" name="Firmar Contrato">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Induccion" name="Completar Inducción">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Fin">
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_Preparar" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Preparar" targetRef="Task_Firmar" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_Firmar" targetRef="Task_Induccion" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_Induccion" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="100" y="50" width="600" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_RH_di" bpmnElement="Lane_RH" isHorizontal="true">
        <dc:Bounds x="130" y="50" width="570" height="120" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Funcionario_di" bpmnElement="Lane_Funcionario" isHorizontal="true">
        <dc:Bounds x="130" y="170" width="570" height="130" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="90" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Preparar_di" bpmnElement="Task_Preparar">
        <dc:Bounds x="260" y="70" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Firmar_di" bpmnElement="Task_Firmar">
        <dc:Bounds x="390" y="190" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Induccion_di" bpmnElement="Task_Induccion">
        <dc:Bounds x="520" y="190" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="640" y="210" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="216" y="108" />
        <di:waypoint x="260" y="108" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="360" y="110" />
        <di:waypoint x="375" y="110" />
        <di:waypoint x="375" y="230" />
        <di:waypoint x="390" y="230" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="490" y="230" />
        <di:waypoint x="520" y="230" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="620" y="230" />
        <di:waypoint x="640" y="230" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,

  compras: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DI" id="Definitions_compras" targetNamespace="http://zflow.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="Aprobación de Compras" processRef="Process_Compras" />
  </bpmn:collaboration>
  <bpmn:process id="Process_Compras" isExecutable="true">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Funcionario" name="Funcionario">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Solicitar</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Admin" name="Administrador">
        <bpmn:flowNodeRef>Task_Aprobar</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_1</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Inicio">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_Solicitar" name="Solicitar Compra">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Aprobar" name="Aprobar Compra">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Fin">
      <bpmn:incoming>Flow_3</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_Solicitar" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Solicitar" targetRef="Task_Aprobar" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_Aprobar" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="100" y="50" width="600" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Funcionario_di" bpmnElement="Lane_Funcionario" isHorizontal="true">
        <dc:Bounds x="130" y="50" width="570" height="120" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Admin_di" bpmnElement="Lane_Admin" isHorizontal="true">
        <dc:Bounds x="130" y="170" width="570" height="130" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="90" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Solicitar_di" bpmnElement="Task_Solicitar">
        <dc:Bounds x="260" y="70" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Aprobar_di" bpmnElement="Task_Aprobar">
        <dc:Bounds x="390" y="190" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="520" y="210" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="216" y="108" />
        <di:waypoint x="260" y="108" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="360" y="110" />
        <di:waypoint x="375" y="110" />
        <di:waypoint x="375" y="230" />
        <di:waypoint x="390" y="230" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="490" y="230" />
        <di:waypoint x="520" y="230" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,
};
