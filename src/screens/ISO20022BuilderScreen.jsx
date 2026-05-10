import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FileCode2, Copy, Download, Network, FileJson, CheckCircle2, Send, Activity, ChevronDown, Search, ArrowLeftRight } from 'lucide-react';
import { translateXmlTo8583 } from '../utils/cbprTranslator';
import { TEST_CARDS } from '../data/testCards';
import { useSimulation } from '../context/SimulationContext';

const ISO_MESSAGES = [
  // PAIN Messages
  { id: 'pain.001.001.13', name: 'CustomerCreditTransferInitiationV13', type: 'ISTH/SWIFT' },
  { id: 'pain.002.001.15', name: 'CustomerPaymentStatusReportV15', type: 'ISTH/SWIFT' },
  { id: 'pain.007.001.13', name: 'CustomerPaymentReversalV13', type: 'ISTH/SWIFT' },
  { id: 'pain.008.001.12', name: 'CustomerDirectDebitInitiationV12', type: 'ISTH/SWIFT' },
  { id: 'pain.009.001.08', name: 'MandateInitiationRequestV08', type: 'SWIFT' },
  { id: 'pain.010.001.08', name: 'MandateAmendmentRequestV08', type: 'SWIFT' },
  { id: 'pain.011.001.08', name: 'MandateCancellationRequestV08', type: 'SWIFT' },
  { id: 'pain.012.001.08', name: 'MandateAcceptanceReportV08', type: 'SWIFT' },
  { id: 'pain.013.001.12', name: 'CreditorPaymentActivationRequestV12', type: 'CBI' },
  { id: 'pain.014.001.12', name: 'CreditorPaymentActivationRequestStatusReportV12', type: 'CBI' },
  { id: 'pain.017.001.04', name: 'MandateCopyRequestV04', type: 'SWIFT & SABS' },
  { id: 'pain.018.001.04', name: 'MandateSuspensionRequestV04', type: 'SWIFT & SABS' },
  // PACS Messages
  { id: 'pacs.002.001.12', name: 'FIToFIPaymentStatusReportV12', type: 'SWIFT' },
  { id: 'pacs.002.001.16', name: 'FIToFIPaymentStatusReportV16', type: 'SWIFT' },
  { id: 'pacs.003.001.12', name: 'FIToFICustomerDirectDebitV12', type: 'SWIFT' },
  { id: 'pacs.004.001.15', name: 'PaymentReturnV15', type: 'SWIFT' },
  { id: 'pacs.007.001.14', name: 'FIToFIPaymentReversalV14', type: 'SWIFT' },
  { id: 'pacs.008.001.14', name: 'FIToFICustomerCreditTransferV14', type: 'SWIFT' },
  { id: 'pacs.009.001.13', name: 'FinancialInstitutionalCreditTransferV13', type: 'SWIFT' },
  { id: 'pacs.010.001.06', name: 'FinancialInstitutionDirectDebitV06', type: 'SWIFT' },
  { id: 'pacs.028.001.07', name: 'FIToFIPaymentStatusRequestV07', type: 'SWIFT & EPC' },
  { id: 'pacs.029.001.02', name: 'MultilateralSettlementV02', type: 'Bank of England' },
  // HEAD Messages
  { id: 'head.001.001.02', name: 'BusinessApplicationHeaderV02', type: 'ISO 20022 TSG' },
  { id: 'head.001.001.04', name: 'BusinessApplicationHeaderV04', type: 'ISO 20022 TSG' },
  { id: 'head.002.001.01', name: 'BusinessFileHeaderV01', type: '4CB and Swift' },
  // CAMT Messages
  { id: 'camt.003.001.08', name: 'GetAccountV08', type: 'SWIFT' },
  { id: 'camt.004.001.10', name: 'ReturnAccountV10', type: 'SWIFT' },
  { id: 'camt.005.001.11', name: 'GetTransactionV11', type: 'SWIFT' },
  { id: 'camt.006.001.11', name: 'ReturnTransactionV11', type: 'SWIFT' },
  { id: 'camt.007.001.10', name: 'ModifyTransactionV10', type: 'SWIFT' },
  { id: 'camt.008.001.11', name: 'CancelTransactionV11', type: 'SWIFT' },
  { id: 'camt.009.001.08', name: 'GetLimitV08', type: 'SWIFT' },
  { id: 'camt.010.001.09', name: 'ReturnLimitV09', type: 'SWIFT' },
  { id: 'camt.011.001.08', name: 'ModifyLimitV08', type: 'SWIFT' },
  { id: 'camt.012.001.08', name: 'DeleteLimitV08', type: 'SWIFT' },
  { id: 'camt.013.001.04', name: 'GetMemberV04', type: 'SWIFT' },
  { id: 'camt.014.001.05', name: 'ReturnMemberV05', type: 'SWIFT' },
  { id: 'camt.015.001.04', name: 'ModifyMemberV04', type: 'SWIFT' },
  { id: 'camt.016.001.04', name: 'GetCurrencyExchangeRateV04', type: 'SWIFT' },
  { id: 'camt.017.001.05', name: 'ReturnCurrencyExchangeRateV05', type: 'SWIFT' },
  { id: 'camt.018.001.05', name: 'GetBusinessDayInformationV05', type: 'SWIFT' },
  { id: 'camt.019.001.07', name: 'ReturnBusinessDayInformationV07', type: 'SWIFT' },
  { id: 'camt.020.001.04', name: 'GetGeneralBusinessInformationV04', type: 'SWIFT' },
  { id: 'camt.021.001.06', name: 'ReturnGeneralBusinessInformationV06', type: 'SWIFT' },
  { id: 'camt.023.001.07', name: 'BackupPaymentV07', type: 'SWIFT' },
  { id: 'camt.024.001.08', name: 'ModifyStandingOrderV08', type: 'SWIFT' },
  { id: 'camt.025.001.09', name: 'ReceiptV09', type: 'Swift' },
  { id: 'camt.026.001.10', name: 'UnableToApplyV10', type: 'SWIFT' },
  { id: 'camt.027.001.10', name: 'ClaimNonReceiptV10', type: 'SWIFT' },
  { id: 'camt.028.001.12', name: 'AdditionalPaymentInformationV12', type: 'SWIFT' },
  { id: 'camt.029.001.14', name: 'ResolutionOfInvestigationV14', type: 'SWIFT' },
  { id: 'camt.030.001.06', name: 'NotificationOfCaseAssignmentV06', type: 'SWIFT' },
  { id: 'camt.031.001.07', name: 'RejectInvestigationV07', type: 'SWIFT' },
  { id: 'camt.032.001.05', name: 'CancelCaseAssignmentV05', type: 'SWIFT' },
  { id: 'camt.033.001.07', name: 'RequestForDuplicateV07', type: 'SWIFT' },
  { id: 'camt.034.001.07', name: 'DuplicateV07', type: 'SWIFT' },
  { id: 'camt.035.001.06', name: 'ProprietaryFormatInvestigationV06', type: 'SWIFT' },
  { id: 'camt.036.001.06', name: 'DebitAuthorisationResponseV06', type: 'SWIFT' },
  { id: 'camt.037.001.10', name: 'DebitAuthorisationRequestV10', type: 'SWIFT' },
  { id: 'camt.038.001.05', name: 'CaseStatusReportRequestV05', type: 'SWIFT' },
  { id: 'camt.039.001.06', name: 'CaseStatusReportV06', type: 'SWIFT' },
  { id: 'camt.040.001.04', name: 'FundEstimatedCashForecastReportV04', type: 'SWIFT' },
  { id: 'camt.041.001.04', name: 'FundConfirmedCashForecastReportV04', type: 'SWIFT' },
  { id: 'camt.042.001.04', name: 'FundDetailedEstimatedCashForecastReportV04', type: 'SWIFT' },
  { id: 'camt.043.001.04', name: 'FundDetailedConfirmedCashForecastReportV04', type: 'SWIFT' },
  { id: 'camt.044.001.03', name: 'FundConfirmedCashForecastReportCancellationV03', type: 'SWIFT' },
  { id: 'camt.045.001.03', name: 'FundDetailedConfirmedCashForecastReportCancellationV03', type: 'SWIFT' },
  { id: 'camt.046.001.08', name: 'GetReservationV08', type: 'SWIFT' },
  { id: 'camt.047.001.08', name: 'ReturnReservationV08', type: 'SWIFT' },
  { id: 'camt.048.001.07', name: 'ModifyReservationV07', type: 'SWIFT' },
  { id: 'camt.049.001.07', name: 'DeleteReservationV07', type: 'SWIFT' },
  { id: 'camt.050.001.07', name: 'LiquidityCreditTransferV07', type: 'SWIFT' },
  { id: 'camt.051.001.07', name: 'LiquidityDebitTransferV07', type: 'SWIFT' },
  { id: 'camt.052.001.14', name: 'BankToCustomerAccountReportV14', type: 'ISTH' },
  { id: 'camt.053.001.14', name: 'BankToCustomerStatementV14', type: 'ISTH' },
  { id: 'camt.054.001.14', name: 'BankToCustomerDebitCreditNotificationV14', type: 'ISTH' },
  { id: 'camt.055.001.13', name: 'CustomerPaymentCancellationRequestV13', type: 'SWIFT' },
  { id: 'camt.056.001.12', name: 'FIToFIPaymentCancellationRequestV12', type: 'SWIFT' },
  { id: 'camt.057.001.09', name: 'NotificationToReceiveV09', type: 'SWIFT' },
  { id: 'camt.058.001.10', name: 'NotificationToReceiveCancellationAdviceV10', type: 'SWIFT' },
  { id: 'camt.059.001.09', name: 'NotificationToReceiveStatusReportV09', type: 'SWIFT' },
  { id: 'camt.060.001.07', name: 'AccountReportingRequestV07', type: 'SWIFT' },
  { id: 'camt.061.001.02', name: 'PayInCallV02', type: 'CLS' },
  { id: 'camt.062.001.03', name: 'PayInScheduleV03', type: 'CLS' },
  { id: 'camt.063.001.02', name: 'PayInEventAcknowledgementV02', type: 'CLS' },
  { id: 'camt.064.001.01', name: 'LimitUtilisationJournalQueryV01', type: '4CBs and Swift' },
  { id: 'camt.065.001.01', name: 'LimitUtilisationJournalReportV01', type: '4CBs and Swift' },
  { id: 'camt.066.001.02', name: 'IntraBalanceMovementInstructionV02', type: '4CBs and Swift' },
  { id: 'camt.067.001.02', name: 'IntraBalanceMovementStatusAdviceV02', type: '4CBs and Swift' },
  { id: 'camt.068.001.02', name: 'IntraBalanceMovementConfirmationV02', type: '4CBs and Swift' },
  { id: 'camt.069.001.05', name: 'GetStandingOrderV05', type: 'SWIFT' },
  { id: 'camt.070.001.06', name: 'ReturnStandingOrderV06', type: 'SWIFT' },
  { id: 'camt.071.001.05', name: 'DeleteStandingOrderV05', type: 'SWIFT' },
  { id: 'camt.072.001.02', name: 'IntraBalanceMovementModificationRequestV02', type: '4CBs and Swift' },
  { id: 'camt.073.001.02', name: 'IntraBalanceMovementModificationRequestStatusAdviceV02', type: '4CBs and Swift' },
  { id: 'camt.074.001.02', name: 'IntraBalanceMovementCancellationRequestV02', type: '4CBs and Swift' },
  { id: 'camt.075.001.02', name: 'IntraBalanceMovementCancellationRequestStatusAdviceV02', type: '4CBs and Swift' },
  { id: 'camt.076.001.01', name: 'BillingReportRequestV01', type: '4CBs and Swfit' },
  { id: 'camt.077.001.01', name: 'BillingReportV01', type: '4CBs and Swift' },
  { id: 'camt.078.001.02', name: 'IntraBalanceMovementQueryV02', type: '4CBs and Swift' },
  { id: 'camt.079.001.02', name: 'IntraBalanceMovementQueryResponseV02', type: '4CBs and Swift' },
  { id: 'camt.080.001.02', name: 'IntraBalanceMovementModificationQueryV02', type: '4CBs and Swift' },
  { id: 'camt.081.001.02', name: 'IntraBalanceMovementModificationReportV02', type: '4CBs and Swift' },
  { id: 'camt.082.001.02', name: 'IntraBalanceMovementCancellationQueryV02', type: '4CBs and Swift' },
  { id: 'camt.083.001.02', name: 'IntraBalanceMovementCancellationReportV02', type: '4CBs and Swift' },
  { id: 'camt.084.001.02', name: 'IntraBalanceMovementPostingReportV02', type: '4CBs and Swift' },
  { id: 'camt.085.001.02', name: 'IntraBalanceMovementPendingReportV02', type: '4CBs and Swift' },
  { id: 'camt.086.001.05', name: 'BankServicesBillingStatementV05', type: 'TWIST & SWIFT' },
  { id: 'camt.087.001.09', name: 'RequestToModifyPaymentV09', type: 'SWIFT' },
  { id: 'camt.088.001.04', name: 'NetReportV04', type: 'CLS' },
  { id: 'camt.101.001.02', name: 'CreateLimitV02', type: 'SWIFT' },
  { id: 'camt.102.001.03', name: 'CreateStandingOrderV03', type: 'SWIFT' },
  { id: 'camt.103.001.03', name: 'CreateReservationV03', type: 'SWIFT' },
  { id: 'camt.104.001.01', name: 'CreateMemberV01', type: 'SWIFT' },
  { id: 'camt.105.001.03', name: 'ChargesPaymentNotificationV03', type: 'SWIFT' },
  { id: 'camt.106.001.03', name: 'ChargesPaymentRequestV03', type: 'SWIFT' },
  { id: 'camt.107.001.02', name: 'ChequePresentmentNotificationV02', type: 'SWIFT' },
  { id: 'camt.108.001.02', name: 'ChequeCancellationOrStopRequestV02', type: 'SWIFT' },
  { id: 'camt.109.001.02', name: 'ChequeCancellationOrStopReportV02', type: 'SWIFT' },
  { id: 'camt.110.001.02', name: 'InvestigationRequestV02', type: 'PaySEG E&I Work Group' },
  { id: 'camt.111.001.03', name: 'InvestigationResponseV03', type: 'PaySEG E&I Work Group' },
  // FXTR Messages
  { id: 'fxtr.008.001.08', name: 'ForeignExchangeTradeStatusNotificationV08', type: 'CLS' },
  { id: 'fxtr.013.001.03', name: 'ForeignExchangeTradeWithdrawalNotificationV03', type: 'CLS' },
  { id: 'fxtr.014.001.06', name: 'ForeignExchangeTradeInstructionV06', type: 'CLS' },
  { id: 'fxtr.015.001.06', name: 'ForeignExchangeTradeInstructionAmendmentV06', type: 'CLS' },
  { id: 'fxtr.016.001.06', name: 'ForeignExchangeTradeInstructionCancellationV06', type: 'CLS' },
  { id: 'fxtr.017.001.06', name: 'ForeignExchangeTradeStatusAndDetailsNotificationV06', type: 'CLS' },
  { id: 'fxtr.030.001.06', name: 'ForeignExchangeTradeBulkStatusNotificationV06', type: 'CLS' },
  { id: 'fxtr.031.001.02', name: 'ForeignExchangeTradeCaptureReportV02', type: 'CFETS' },
  { id: 'fxtr.032.001.02', name: 'ForeignExchangeTradeCaptureReportRequestV02', type: 'CFETS' },
  { id: 'fxtr.033.001.02', name: 'ForeignExchangeTradeCaptureReportAcknowledgementV02', type: 'CFETS' },
  { id: 'fxtr.034.001.02', name: 'ForeignExchangeTradeConfirmationRequestV02', type: 'CFETS' },
  { id: 'fxtr.035.001.02', name: 'ForeignExchangeTradeConfirmationRequestAmendmentRequestV02', type: 'CFETS' },
  { id: 'fxtr.036.001.02', name: 'ForeignExchangeTradeConfirmationRequestCancellationRequestV02', type: 'CFETS' },
  { id: 'fxtr.037.001.02', name: 'ForeignExchangeTradeConfirmationStatusAdviceV02', type: 'CFETS' },
  { id: 'fxtr.038.001.02', name: 'ForeignExchangeTradeConfirmationStatusAdviceAcknowledgementV02', type: 'CFETS' },
  // COLR Messages
  { id: 'colr.001.001.02', name: 'CollateralValueQueryV02', type: '4CBs and Swift' },
  { id: 'colr.002.001.02', name: 'CollateralValueReportV02', type: '4CBs and Swift' },
  { id: 'colr.003.001.05', name: 'MarginCallRequestV05', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.004.001.05', name: 'MarginCallResponseV05', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.005.001.06', name: 'CollateralManagementCancellationRequestV06', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.006.001.05', name: 'CollateralManagementCancellationStatusV05', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.007.001.06', name: 'CollateralProposalV06', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.008.001.06', name: 'CollateralProposalResponseV06', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.009.001.05', name: 'MarginCallDisputeNotificationV05', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.010.001.05', name: 'CollateralSubstitutionRequestV05', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.011.001.05', name: 'CollateralSubstitutionResponseV05', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.012.001.05', name: 'CollateralSubstitutionConfirmationV05', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.013.001.05', name: 'InterestPaymentRequestV05', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.014.001.05', name: 'InterestPaymentResponseV05', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.015.001.05', name: 'InterestPaymentStatementV05', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.016.001.05', name: 'CollateralAndExposureReportV05', type: 'SWIFT, FPL, ISDA/FpML, ISITC' },
  { id: 'colr.019.001.01', name: 'TripartyCollateralTransactionInstructionV01', type: 'SWIFT/Banco de Espana' },
  { id: 'colr.020.001.01', name: 'TripartyCollateralTransactionInstructionProcessingStatusAdviceV01', type: 'SWIFT/Banco de Espana' },
  { id: 'colr.021.001.01', name: 'TripartyCollateralAllegementNotificationV01', type: 'SWIFT/Banco de Espana' },
  { id: 'colr.022.001.01', name: 'TripartyCollateralAndExposureReportV01', type: 'SWIFT/Banco de Espana' },
  { id: 'colr.023.001.01', name: 'TripartyCollateralStatusAdviceV01', type: 'SWIFT/Banco de Espana' },
  { id: 'colr.024.001.01', name: 'TripartyCollateralAllegementNotificationCancellationAdviceV01', type: 'SWIFT/Banco de Espana' },
  // REDA Messages
  { id: 'reda.074.001.01', name: 'TripartyCollateralUnilateralRemovalRequestV01', type: 'SWIFT/Banco de Espana' },
  // CATP Messages
  { id: 'catp.001.001.03', name: 'ATMWithdrawalRequestV03', type: 'nexo' },
  { id: 'catp.002.001.03', name: 'ATMWithdrawalResponseV03', type: 'nexo' },
  { id: 'catp.003.001.03', name: 'ATMWithdrawalCompletionAdviceV03', type: 'nexo' },
  { id: 'catp.004.001.03', name: 'ATMWithdrawalCompletionAcknowledgementV03', type: 'nexo' },
  { id: 'catp.005.001.02', name: 'ATMRejectV02', type: 'nexo A.I.S.B.L. & IFX' },
  { id: 'catp.006.001.03', name: 'ATMInquiryRequestV03', type: 'nexo' },
  { id: 'catp.007.001.03', name: 'ATMInquiryResponseV03', type: 'nexo' },
  { id: 'catp.008.001.03', name: 'ATMCompletionAdviceV03', type: 'nexo' },
  { id: 'catp.009.001.03', name: 'ATMCompletionAcknowledgementV03', type: 'nexo' },
  { id: 'catp.010.001.03', name: 'ATMPINManagementRequestV03', type: 'nexo' },
  { id: 'catp.011.001.03', name: 'ATMPINManagementResponseV03', type: 'nexo' },
  { id: 'catp.012.001.02', name: 'ATMDepositRequestV02', type: 'nexo' },
  { id: 'catp.013.001.02', name: 'ATMDepositResponseV02', type: 'nexo' },
  { id: 'catp.014.001.02', name: 'ATMDepositCompletionAdviceV02', type: 'nexo' },
  { id: 'catp.015.001.02', name: 'ATMDepositCompletionAcknowledgementV02', type: 'nexo' },
  { id: 'catp.016.001.02', name: 'ATMTransferRequestV02', type: 'nexo' },
  { id: 'catp.017.001.02', name: 'ATMTransferResponseV02', type: 'nexo' },
  // CATM Messages
  { id: 'catm.001.001.15', name: 'StatusReportV15', type: 'nexo' },
  { id: 'catm.002.001.14', name: 'ManagementPlanReplacementV14', type: 'nexo' },
  { id: 'catm.003.001.15', name: 'AcceptorConfigurationUpdateV15', type: 'nexo' },
  { id: 'catm.004.001.05', name: 'TerminalManagementRejectionV05', type: 'nexo' },
  { id: 'catm.005.001.12', name: 'MaintenanceDelegationRequestV12', type: 'nexo' },
  { id: 'catm.006.001.08', name: 'MaintenanceDelegationResponseV08', type: 'nexo' },
  { id: 'catm.007.001.08', name: 'CertificateManagementRequestV08', type: 'nexo' },
  { id: 'catm.008.001.07', name: 'CertificateManagementResponseV07', type: 'nexo' },
  // CASR Messages
  { id: 'casr.001.001.04', name: 'SettlementReportingInitiationV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'casr.002.001.04', name: 'SettlementReportingResponseV04', type: 'ISO TC68/SC9/TG1' },
  // CASP Messages
  { id: 'casp.001.001.08', name: 'SaleToPOIServiceRequestV08', type: 'nexo' },
  { id: 'casp.002.001.08', name: 'SaleToPOIServiceResponseV08', type: 'nexo' },
  { id: 'casp.003.001.08', name: 'SaleToPOIReconciliationRequestV08', type: 'nexo' },
  { id: 'casp.004.001.08', name: 'SaleToPOIReconciliationResponseV08', type: 'nexo' },
  { id: 'casp.005.001.08', name: 'SaleToPOISessionManagementRequestV08', type: 'nexo' },
  { id: 'casp.006.001.08', name: 'SaleToPOISessionManagementResponseV08', type: 'nexo' },
  { id: 'casp.007.001.08', name: 'SaleToPOIAdministrativeRequestV08', type: 'nexo' },
  { id: 'casp.008.001.08', name: 'SaleToPOIAdministrativeResponseV08', type: 'nexo' },
  { id: 'casp.009.001.08', name: 'SaleToPOIReportRequestV08', type: 'nexo' },
  { id: 'casp.010.001.08', name: 'SaleToPOIReportResponseV08', type: 'nexo' },
  { id: 'casp.011.001.08', name: 'SaleToPOIAbortV08', type: 'nexo' },
  { id: 'casp.012.001.08', name: 'SaleToPOIEventNotificationV08', type: 'nexo' },
  { id: 'casp.013.001.02', name: 'SaleToPOIMessageRejectionV02', type: 'nexo' },
  { id: 'casp.014.001.08', name: 'SaleToPOIMessageStatusRequestV08', type: 'nexo' },
  { id: 'casp.015.001.08', name: 'SaleToPOIMessageStatusResponseV08', type: 'nexo' },
  { id: 'casp.016.001.08', name: 'SaleToPOIDeviceRequestV08', type: 'nexo' },
  { id: 'casp.017.001.08', name: 'SaleToPOIDeviceResponseV08', type: 'nexo' },
  // CAIN Messages
  { id: 'cain.001.001.05', name: 'AuthorisationInitiationV05', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.002.001.05', name: 'AuthorisationResponseV05', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.003.001.05', name: 'FinancialInitiationV05', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.004.001.05', name: 'FinancialResponseV05', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.005.001.05', name: 'ReversalInitiationV05', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.006.001.05', name: 'ReversalResponseV05', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.014.001.04', name: 'RetrievalFulfilmentInitiationV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.015.001.04', name: 'RetrievalFulfilmentResponseV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.016.001.04', name: 'InquiryVerificationInitiationV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.017.001.04', name: 'InquiryVerificationResponseV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.020.001.04', name: 'AmendmentV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.021.001.04', name: 'RetrievalInitiationV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.022.001.04', name: 'RetrievalResponseV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.023.001.04', name: 'CardManagementInitiationV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.024.001.04', name: 'CardManagementResponseV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.025.001.04', name: 'AddendumInitiationV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.026.001.04', name: 'AddendumResponseV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.027.001.04', name: 'ChargeBackInitiationV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cain.028.001.04', name: 'ChargeBackResponseV04', type: 'ISO TC68/SC9/TG1' },
  // CAFR Messages
  { id: 'cafr.001.001.04', name: 'FraudReportingInitiationV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cafr.002.001.04', name: 'FraudReportingResponseV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cafr.003.001.04', name: 'FraudDispositionInitiationV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cafr.004.001.04', name: 'FraudDispositionResponseV04', type: 'ISO TC68/SC9/TG1' },
  // CAFM Messages
  { id: 'cafm.001.001.04', name: 'FileActionInitiationV04', type: 'ISO TC68/SC9/TG1' },
  { id: 'cafm.002.001.04', name: 'FileActionResponseV04', type: 'ISO TC68/SC9/TG1' },
  // AUTH Messages
  { id: 'auth.001.001.02', name: 'InformationRequestOpeningV02', type: 'Finance Finland' },
  { id: 'auth.002.001.02', name: 'InformationRequestResponseV02', type: 'Finance Finland' },
  { id: 'auth.003.001.01', name: 'InformationRequestStatusCHangeNotificationV01', type: 'FFI' },
  { id: 'auth.012.001.02', name: 'MoneyMarketSecuredMarketStatisticalReportV02', type: 'ECB/Banque de France/Bundesbank/Banco de Espana' },
  { id: 'auth.013.001.02', name: 'MoneyMarketUnsecuredMarketStatisticalReportV02', type: 'ECB/Banque de France/Bundesbank/Banco de Espana' },
  { id: 'auth.014.001.02', name: 'MoneyMarketForeignExchangeSwapsStatisticalReportV02', type: 'ECB/Banque de France/Bundesbank/Banco de Espana' },
  { id: 'auth.015.001.02', name: 'MoneyMarketOvernightIndexSwapsStatisticalReportV02', type: 'ECB/Banque de France/Bundesbank/Banco de Espana' },
  { id: 'auth.016.001.03', name: 'FinancialInstrumentReportingTransactionReportV03', type: 'ESMA' },
  { id: 'auth.017.001.02', name: 'FinancialInstrumentReportingReferenceDataReportV02', type: 'ESMA' },
  { id: 'auth.018.001.04', name: 'ContractRegistrationRequestV04', type: 'RU-CMPG' },
  { id: 'auth.019.001.04', name: 'ContractRegistrationConfirmationV04', type: 'RU-CMPG' },
  { id: 'auth.020.001.04', name: 'ContractRegistrationClosureRequestV04', type: 'RU-CMPG' },
  { id: 'auth.021.001.04', name: 'ContractRegistrationAmendmentRequestV04', type: 'RU-CMPG' },
  { id: 'auth.022.001.04', name: 'ContractRegistrationStatementV04', type: 'RU-CMPG' },
  { id: 'auth.023.001.04', name: 'ContractRegistrationStatementRequestV04', type: 'RU-CMPG' },
  { id: 'auth.024.001.04', name: 'PaymentRegulatoryInformationNotificationV04', type: 'RU-CMPG' },
  { id: 'auth.025.001.04', name: 'CurrencyControlSupportingDocumentDeliveryV04', type: 'RU-CMPG' },
  { id: 'auth.026.001.04', name: 'CurrencyControlRequestOrLetterV04', type: 'RU-CMPG' },
  { id: 'auth.027.001.04', name: 'CurrencyControlStatusAdviceV04', type: 'RU-CMPG' },
  { id: 'auth.028.001.01', name: 'MoneyMarketStatisticalReportStatusAdviceV01', type: 'ECB/Banque de France/Bundesbank/Banco de Espana' },
  { id: 'auth.029.001.05', name: 'DerivativesTradeReportQueryV05', type: 'ESMA' },
  { id: 'auth.030.001.04', name: 'DerivativesTradeReportV04', type: 'ESMA' },
  { id: 'auth.031.001.01', name: 'FinancialInstrumentReportingStatusAdviceV01', type: 'ESMA' },
  { id: 'auth.032.001.01', name: 'FinancialInstrumentReportingEquityTransparencyDataReportV01', type: 'ESMA' },
  { id: 'auth.033.001.03', name: 'FinancialInstrumentReportingNonEquityTransparencyDataReportV03', type: 'ESMA' },
  { id: 'auth.034.001.01', name: 'InvoiceTaxReportV01', type: 'FFI & Tieto' },
  { id: 'auth.035.001.01', name: 'FinancialInstrumentReportingTradingVolumeCapDataReportV01', type: 'ESMA' },
  { id: 'auth.036.001.03', name: 'FinancialInstrumentReportingReferenceDataDeltaReportV03', type: 'ESMA' },
  { id: 'auth.038.001.01', name: 'InvoiceTaxReportStatusAdviceV01', type: 'FFI & Tieto' },
  { id: 'auth.039.001.01', name: 'FinancialInstrumentReportingNonWorkingDayReportV01', type: 'ESMA' },
  { id: 'auth.040.001.01', name: 'FinancialInstrumentReportingEquityTradingActivityReportV01', type: 'ESMA' },
  { id: 'auth.041.001.01', name: 'FinancialInstrumentReportingNonEquityTradingActivityReportV01', type: 'ESMA' },
  { id: 'auth.042.001.02', name: 'FinancialInstrumentReportingInvalidReferenceDataReportV02', type: 'ESMA' },
  { id: 'auth.043.001.01', name: 'FinancialInstrumentReportingReferenceDataIndexReportV01', type: 'ESMA' },
  { id: 'auth.044.001.03', name: 'FinancialInstrumentReportingEquityTradingActivityResultV03', type: 'ESMA' },
  { id: 'auth.045.001.03', name: 'FinancialInstrumentReportingNonEquityTradingActivityResultV03', type: 'ESMA' },
  { id: 'auth.047.001.01', name: 'FinancialInstrumentReportingCountryCodeReportV01', type: 'ESMA' },
  { id: 'auth.048.001.01', name: 'FinancialInstrumentReportingCurrencyCodeReportV01', type: 'ESMA' },
  { id: 'auth.049.001.02', name: 'FinancialInstrumentReportingMarketIdentificationCodeReportV02', type: 'ESMA' },
  { id: 'auth.050.001.01', name: 'FinancialInstrumentReportingInstrumentClassificationReportV01', type: 'ESMA' },
  { id: 'auth.052.001.02', name: 'SecuritiesFinancingReportingTransactionReportV02', type: 'ESMA' },
  { id: 'auth.053.001.01', name: 'FinancialInstrumentReportingTradingVolumeCapResultReportV01', type: 'ESMA' },
  { id: 'auth.054.001.01', name: 'CCPClearingMemberReportV01', type: 'Bank of England' },
  { id: 'auth.055.001.01', name: 'CCPMemberRequirementsReportV01', type: 'Bank of England' },
  { id: 'auth.056.001.01', name: 'CCPMemberObligationsReportV01', type: 'Bank of England' },
  { id: 'auth.057.001.02', name: 'CCPPortfolioStressTestingDefinitionReportV02', type: 'Bank of England' },
  { id: 'auth.058.001.01', name: 'CCPPortfolioStressTestingResultReportV01', type: 'Bank of England' },
  { id: 'auth.059.001.02', name: 'CCPIncomeStatementAndCapitalAdequacyReportV02', type: 'Bank of England' },
  { id: 'auth.060.001.02', name: 'CCPDailyCashFlowsReportV02', type: 'Bank of England' },
  { id: 'auth.061.001.02', name: 'CCPInvestmentsReportV02', type: 'Bank of England' },
  { id: 'auth.062.001.01', name: 'CCPLiquidityStressTestingDefinitionReportV01', type: 'Bank of England' },
  { id: 'auth.063.001.01', name: 'CCPLiquidityStressTestingResultReportV01', type: 'Bank of England' },
  { id: 'auth.064.001.02', name: 'CCPAvailableFinancialResourcesReportV02', type: 'Bank of England' },
  { id: 'auth.065.001.01', name: 'CCPBackTestingDefinitionReportV01', type: 'Bank of England' },
  { id: 'auth.066.001.01', name: 'CCPBackTestingResultReportV01', type: 'Bank of England' },
  { id: 'auth.067.001.01', name: 'CCPCollateralReportV01', type: 'Bank of England' },
  { id: 'auth.068.001.01', name: 'CCPAccountPositionReportV01', type: 'Bank of England' },
  { id: 'auth.069.001.03', name: 'CCPClearedProductReportV03', type: 'Bank of England' },
  { id: 'auth.070.001.02', name: 'SecuritiesFinancingReportingTransactionMarginDataReportV02', type: 'ESMA' },
  { id: 'auth.071.001.02', name: 'SecuritiesFinancingReportingTransactionReusedCollateralDataReportV02', type: 'ESMA' },
  { id: 'auth.072.001.01', name: 'SettlementInternaliserReportV01', type: 'ESMA' },
  { id: 'auth.076.001.01', name: 'FinancialSupervisedPartyIdentityReportV01', type: 'ESMA' },
  { id: 'auth.077.001.01', name: 'FinancialBenchmarkReportV01', type: 'ESMA' },
  { id: 'auth.078.001.02', name: 'SecuritiesFinancingReportingPairingRequestV02', type: 'ESMA' },
  { id: 'auth.079.001.02', name: 'SecuritiesFinancingReportingTransactionStateReportV02', type: 'ESMA' },
  { id: 'auth.080.001.02', name: 'SecuritiesFinancingReportingReconciliationStatusAdviceV02', type: 'ESMA' },
  { id: 'auth.083.001.02', name: 'SecuritiesFinancingReportingMissingCollateralRequestV02', type: 'ESMA' },
  { id: 'auth.084.001.02', name: 'SecuritiesFinancingReportingTransactionStatusAdviceV02', type: 'ESMA' },
  { id: 'auth.085.001.02', name: 'SecuritiesFinancingReportingMarginDataTransactionStateReportV02', type: 'ESMA' },
  { id: 'auth.086.001.02', name: 'SecuritiesFinancingReportingReusedCollateralDataTransactionStateReportV02', type: 'ESMA' },
  { id: 'auth.090.001.02', name: 'DerivativesTradePositionSetReportV02', type: 'ESMA' },
  { id: 'auth.091.001.03', name: 'DerivativesTradeReconciliationStatisticalReportV03', type: 'ESMA' },
  { id: 'auth.092.001.04', name: 'DerivativesTradeRejectionStatisticalReportV04', type: 'ESMA' },
  { id: 'auth.094.001.02', name: 'SecuritiesFinancingReportingTransactionQueryV02', type: 'ESMA' },
  { id: 'auth.100.001.01', name: 'SettlementFailsMonthlyReportV01', type: 'ESMA' },
  { id: 'auth.101.001.01', name: 'SettlementFailsAnnualReportV01', type: 'ESMA' },
  { id: 'auth.102.001.01', name: 'FinancialInstrumentReportingCancellationReportV01', type: 'ESMA' },
  { id: 'auth.105.001.01', name: 'SecuritiesFinancingReportingPositionSetReportV01', type: 'ESMA' },
  { id: 'auth.106.001.01', name: 'DerivativesTradeWarningsReportV01', type: 'ESMA' },
  { id: 'auth.107.001.02', name: 'DerivativesTradeStateReportV02', type: 'ESMA' },
  { id: 'auth.108.001.02', name: 'DerivativesTradeMarginDataReportV02', type: 'ESMA' },
  { id: 'auth.109.001.02', name: 'DerivativesTradeMarginDataTransactionStateReportV02', type: 'ESMA' },
  { id: 'auth.112.001.01', name: 'CCPInteroperabilityReportV01', type: 'Bank of England' },
  { id: 'auth.113.001.01', name: 'OrderBookReportV01', type: 'ESMA' },
  { id: 'auth.114.001.01', name: 'RegulatoryMetadataReportV01', type: 'ESMA' },
];

const highlightXML = (xml) => {
  if (!xml) return '';
  return xml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(&lt;\/?[a-zA-Z0-9_.-]+)/g, '<span class="text-pink-400 font-medium">$1</span>') // Tags
    .replace(/(&gt;)/g, '<span class="text-pink-400 font-medium">$1</span>') // Tags close
    .replace(/([a-zA-Z0-9_.-]+)=/g, '<span class="text-purple-400">$1</span>=') // Attributes
    .replace(/("[^"]*")/g, '<span class="text-green-300">$1</span>') // Strings
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-gray-500 italic">$1</span>'); // Comments
};

function ISO20022BuilderScreen() {
  const [selectedMsg, setSelectedMsg] = useState(ISO_MESSAGES[0].id);

  const [schema, setSchema] = useState(null);
  const [dynamicData, setDynamicData] = useState({});
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [serverResponse, setServerResponse] = useState(null);

  const [wrapAppHdr, setWrapAppHdr] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [outputMode, setOutputMode] = useState('xml'); // 'xml' or '8583'

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { vaultCards, refreshVault } = useSimulation();

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return ISO_MESSAGES;
    const lowerQ = searchQuery.toLowerCase();
    return ISO_MESSAGES.filter(m => m.id.toLowerCase().includes(lowerQ) || m.name.toLowerCase().includes(lowerQ));
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [tcpConfig, setTcpConfig] = useState({
    host: '127.0.0.1',
    port: '8583',
    useTLS: false
  });

  // Banking Intelligence State
  const [bankingData, setBankingData] = useState({
    uetr: crypto.randomUUID(),
    senderBic: 'SIMUSA01XXX',
    receiverBic: 'TARGETSA02XXX',
    chargeBearer: 'SHA',
    instructionId: `INST-${Date.now()}`
  });

  const generateUETR = () => setBankingData(prev => ({ ...prev, uetr: crypto.randomUUID() }));

  const isValidBIC = (bic) => /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic);

  const handleBankingChange = (field, value) => {
    setBankingData(prev => ({ ...prev, [field]: value }));
  };

  const handleCardSelection = (pan) => {
    const allCards = [...vaultCards, ...TEST_CARDS];
    const card = allCards.find(c => c.pan === pan);
    if (!card) return;

    // Logic: Map card to common ISO 20022 fields
    // 1. pacs.008 / pain.001 Debtor Account
    if (dynamicData['DbtrAcct'] !== undefined) {
      handleDynamicChange('DbtrAcct', null, card.pan);
    }
    if (dynamicData['CdtTrfTxInf']?.['DbtrAcct'] !== undefined) {
      handleDynamicChange('CdtTrfTxInf', 'DbtrAcct', card.pan);
    }

    // 2. cain.001 PAN
    if (dynamicData['Card'] !== undefined) {
      handleDynamicChange('Card', 'Pan', card.pan);
    }

    // 3. Update Banking Data for metadata
    setBankingData(prev => ({
      ...prev,
      senderBic: card.issuer_name === 'Al Rajhi Bank' ? 'ALRJSARIXXX' : (card.network === 'mada' ? 'SABBSA22XXX' : prev.senderBic)
    }));
  };

  useEffect(() => {
    setIsLoadingSchema(true);
    fetch(`/api/iso20022/schema/${selectedMsg}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSchema(data.schema);
          // Initialize default dynamic data
          const defaults = {};
          data.schema.elements.forEach(el => {
            if (el.type === 'complex') {
              defaults[el.name] = {};
              el.subElements.forEach(sub => defaults[el.name][sub.name] = '');
            } else {
              defaults[el.name] = '';
            }
          });

          // Restore from localStorage draft if exists
          const savedDraft = localStorage.getItem(`iso_draft_${selectedMsg}`);
          if (savedDraft) {
            try {
              setDynamicData({ ...defaults, ...JSON.parse(savedDraft) });
            } catch (e) {
              setDynamicData(defaults);
            }
          } else {
            setDynamicData(defaults);
          }
        }
        setIsLoadingSchema(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingSchema(false);
      });
  }, [selectedMsg]);

  const handleDynamicChange = (elName, subName, value) => {
    setDynamicData(prev => {
      const next = { ...prev };
      if (subName) {
        next[elName] = { ...next[elName], [subName]: value };
      } else {
        next[elName] = value;
      }

      // Save draft to local storage
      localStorage.setItem(`iso_draft_${schema?.messageId || selectedMsg}`, JSON.stringify(next));

      return next;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xsd') || file.name.endsWith('.xml'))) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target.result;
        parseAndApplyXSD(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  const parseAndApplyXSD = (xmlText, filename) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      let targetNamespace = "urn:iso:std:iso:20022:tech:xsd:custom";
      const schemaNodes = xmlDoc.getElementsByTagNameNS("*", "schema");
      if (schemaNodes.length > 0) {
        targetNamespace = schemaNodes[0].getAttribute("targetNamespace") || targetNamespace;
      }

      const messageIdMatch = targetNamespace.match(/xsd:([^:]+)$/);
      const derivedMessageId = messageIdMatch ? messageIdMatch[1] : filename.replace('.xsd', '');

      const elements = [];
      const complexTypes = Array.from(xmlDoc.getElementsByTagNameNS("*", "complexType"));

      if (complexTypes.length > 0) {
        const rootType = complexTypes[0];
        const seqElements = Array.from(rootType.getElementsByTagNameNS("*", "element"));
        seqElements.forEach(el => {
          const name = el.getAttribute("name");
          if (!name) return;

          const typeAttr = el.getAttribute("type");
          if (typeAttr && !typeAttr.startsWith("xs:")) {
            elements.push({
              name, type: 'complex', required: el.getAttribute("minOccurs") !== "0",
              subElements: [{ name: "RawData", type: "string", required: false, description: typeAttr }]
            });
          } else {
            elements.push({
              name, type: 'string', required: el.getAttribute("minOccurs") !== "0", description: typeAttr || 'string'
            });
          }
        });
      } else {
        elements.push({ name: "UnparsedContent", type: "string", required: true, description: "No complexTypes found in XSD" });
      }

      const newSchema = {
        messageId: derivedMessageId,
        namespace: targetNamespace,
        parsedFromRealXSD: true,
        elements
      };

      setSchema(newSchema);

      fetch('/api/iso20022/schema/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: derivedMessageId, schema: newSchema })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setServerResponse("Successfully parsed and saved custom XSD: " + filename);
          } else {
            setServerResponse("Parsed XSD but failed to save to server: " + data.error);
          }
        })
        .catch(err => {
          console.error("Failed to save schema to server", err);
          setServerResponse("Successfully parsed XSD locally, but server save failed.");
        });

      // Init dynamic data
      const defaults = {};
      newSchema.elements.forEach(el => {
        if (el.type === 'complex') {
          defaults[el.name] = {};
          el.subElements.forEach(sub => defaults[el.name][sub.name] = '');
        } else {
          defaults[el.name] = '';
        }
      });

      // Restore from localStorage draft if exists
      const savedDraft = localStorage.getItem(`iso_draft_${derivedMessageId}`);
      if (savedDraft) {
        try {
          setDynamicData({ ...defaults, ...JSON.parse(savedDraft) });
        } catch (e) {
          setDynamicData(defaults);
        }
      } else {
        setDynamicData(defaults);
      }

    } catch (err) {
      console.error("XSD Parse Error", err);
      setServerResponse("Error parsing custom XSD: " + err.message);
    }
  };

  // Generate XML
  const generatedXml = useMemo(() => {
    if (!schema) return '<!-- Loading Schema... -->';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;

    let indent = '';

    if (wrapAppHdr) {
      xml += `<RequestPayload>\n`;
      xml += `  <AppHdr xmlns="urn:iso:std:iso:20022:tech:xsd:head.001.001.02">\n`;
      xml += `    <Fr><FIId><FinInstnId><BICFI>${bankingData.senderBic}</BICFI></FinInstnId></FIId></Fr>\n`;
      xml += `    <To><FIId><FinInstnId><BICFI>${bankingData.receiverBic}</BICFI></FinInstnId></FIId></To>\n`;
      xml += `    <BizMsgIdr>${bankingData.instructionId}</BizMsgIdr>\n`;
      xml += `    <MsgDefIdr>${schema.messageId}</MsgDefIdr>\n`;
      xml += `    <CreDt>${new Date().toISOString()}</CreDt>\n`;
      xml += `  </AppHdr>\n`;
      xml += `  <Document xmlns="${schema.namespace}">\n`;
      indent = '  ';
    } else {
      xml += `<Document xmlns="${schema.namespace}">\n`;
    }

    const rootName = schema.messageId.replace(/\./g, '');
    xml += `${indent}  <${rootName}>\n`;

    // Automatic pacs.008/009 banking injection
    if (schema.messageId.startsWith('pacs.008')) {
      xml += `${indent}    <GrpHdr>\n`;
      xml += `${indent}      <MsgId>${bankingData.instructionId}</MsgId>\n`;
      xml += `${indent}      <CreDtTm>${new Date().toISOString()}</CreDtTm>\n`;
      xml += `${indent}      <NbOfTxs>1</NbOfTxs>\n`;
      xml += `${indent}      <SttlmInf><SttlmMtd>IND</SttlmMtd></SttlmInf>\n`;
      xml += `${indent}    </GrpHdr>\n`;
      xml += `${indent}    <CdtTrfTxInf>\n`;
      xml += `${indent}      <PmtId>\n`;
      xml += `${indent}        <InstrId>${bankingData.instructionId}</InstrId>\n`;
      xml += `${indent}        <EndToEndId>${bankingData.instructionId}</EndToEndId>\n`;
      xml += `${indent}        <UETR>${bankingData.uetr}</UETR>\n`;
      xml += `${indent}      </PmtId>\n`;
      xml += `${indent}      <ChrgBr>${bankingData.chargeBearer}</ChrgBr>\n`;
      // ... rest of dynamic elements will follow
    }

    schema.elements.forEach(el => {
      if (el.type === 'complex') {
        xml += `${indent}    <${el.name}>\n`;
        el.subElements.forEach(sub => {
          const val = dynamicData[el.name]?.[sub.name];
          if (val) {
            xml += `${indent}      <${sub.name}>${val}</${sub.name}>\n`;
          } else if (sub.required) {
            xml += `${indent}      <${sub.name}>[REQUIRED]</${sub.name}>\n`;
          }
        });
        xml += `${indent}    </${el.name}>\n`;
      } else {
        const val = dynamicData[el.name];
        if (val) {
          xml += `${indent}    <${el.name}>${val}</${el.name}>\n`;
        } else if (el.required) {
          xml += `${indent}    <${el.name}>[REQUIRED]</${el.name}>\n`;
        }
      }
    });

    xml += `${indent}  </${rootName}>\n`;
    xml += `${indent}</Document>`;

    if (wrapAppHdr) {
      xml += `\n</RequestPayload>`;
    }

    return xml;
  }, [schema, dynamicData, wrapAppHdr]);

  const bridgeMetadata = useMemo(() => {
    if (!schema) return [];
    const meta = [];
    if (schema.messageId.startsWith('pacs.008')) {
      meta.push({ xml: 'CdtTrfTxInf > IntrBkSttlmAmt', iso: 'DE 004', reason: 'Settlement Amount Mapping' });
      meta.push({ xml: 'GrpHdr > CreDtTm', iso: 'DE 007', reason: 'Transmission Date/Time Synchronization' });
      meta.push({ xml: 'CdtTrfTxInf > DbtrAcct', iso: 'DE 002', reason: 'Primary Account Identification' });
      meta.push({ xml: 'CdtTrfTxInf > EndToEndId', iso: 'DE 104', reason: 'Transaction Trace Reference' });
    } else {
      meta.push({ xml: 'Dynamic Pattern', iso: 'MTI 0200', reason: 'Default Financial Class' });
    }
    return meta;
  }, [schema]);

  const translated8583 = useMemo(() => {
    if (!schema) return null;
    return translateXmlTo8583(schema.messageId, dynamicData);
  }, [schema, dynamicData]);

  const copyToClipboard = () => {
    const textToCopy = outputMode === 'xml' ? generatedXml : JSON.stringify(translated8583, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadXml = () => {
    const blob = new Blob([generatedXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedMsg}_${Date.now()}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const transmitXml = async () => {
    setIsTransmitting(true);
    setServerResponse(null);
    try {
      // 1. AML / Sanctions Screening Phase
      setServerResponse("🛡️ AML Screening: Verifying parties against sanctions lists...");
      await new Promise(r => setTimeout(r, 1500));

      const isSanctioned = bankingData.receiverBic.includes('BAD') || bankingData.senderBic.includes('BAD');
      if (isSanctioned) {
        throw new Error("AML_FLAG: Transaction blocked due to potential sanctions match on Receiver/Sender BIC.");
      }

      setServerResponse("✅ AML Clear. Initializing correspondent bank routing...");
      await new Promise(r => setTimeout(r, 1000));

      // 2. Network Delay Simulation (Correspondent Banking Latency)
      setServerResponse("⏳ Network Delay: Routing through intermediary hops...");
      await new Promise(r => setTimeout(r, 2000));

      let endpoint = '/api/transmit/xml';
      let payload = {
        xmlPayload: generatedXml,
        metadata: {
          amount: dynamicData['CdtTrfTxInf']?.['IntrBkSttlmAmt'] || dynamicData['GrpHdr']?.['TtlIntrBkSttlmAmt'] || '0',
          currency: 'SAR',
          uetr: bankingData.uetr,
          senderBic: bankingData.senderBic,
          receiverBic: bankingData.receiverBic,
          procCode: schema.messageId.startsWith('pacs.008') ? '260000' : '000000'
        },
        tcpConfig: { host: tcpConfig.host, port: tcpConfig.port, useTLS: tcpConfig.useTLS, timeout: 5000 }
      };

      if (outputMode === '8583' && translated8583) {
        endpoint = '/api/transmit';
        payload = {
          mti: translated8583.mti,
          elements: translated8583.elements,
          tcpConfig: { host: tcpConfig.host, port: tcpConfig.port, useTLS: tcpConfig.useTLS, timeout: 5000 }
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setServerResponse(`🚀 SETTLED: Transaction processed successfully.\n\nUETR: ${bankingData.uetr}\nBridge Status: ${outputMode === '8583' ? 'ISO 8583 CONVERTED' : 'XML NATIVE'}\n\nRaw Response:\n${data.rawRx || 'ACK'}`);
      } else {
        setServerResponse(`❌ REJECTED: ${data.error}`);
      }
    } catch (err) {
      setServerResponse(`🚫 ${err.message.includes('AML') ? 'AML_BLOCK' : 'CONNECTION_ERROR'}: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div
      className="h-full w-full flex flex-col md:flex-row overflow-y-auto md:overflow-hidden p-4 md:p-8 gap-6 relative bg-[#050508] custom-scrollbar"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Background Ambient Effects */}
      <div className="fixed top-0 right-0 w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="max-w-[1600px] mx-auto w-full flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-cyan-900/40 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-cyan-400 rounded-xl m-6 transition-all">
            <div className="bg-black/80 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
              <FileJson size={64} className="text-cyan-400 mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-white mb-2">Drop .XSD File to Parse</h2>
              <p className="text-cyan-200">The schema will be instantly converted to an AST and rendered.</p>
            </div>
          </div>
        )}

        {/* Left: Configuration & Input */}
        <div className="w-[35%] flex flex-col gap-4 overflow-hidden">
          <div className="glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative flex-shrink-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            <div className="p-4 border-b border-white/5 bg-black/20">
              <h2 className="text-sm font-semibold text-gray-200 flex items-center">
                <Network size={16} className="mr-2 text-blue-400" />
                ISO 20022 Messaging Schema
              </h2>
            </div>
            <div className="p-4">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block text-center">Message Type (PAIN / PACS / HEAD / CAMT / FXTR / COLR / REDA / CATP / CATM / CASR / CASP / CAIN / CAFR / CAFM / AUTH)</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-[#0a0a0f] border border-gray-700 rounded-lg py-2 px-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors flex justify-between items-center"
                >
                  <span className="truncate pr-4 text-left font-mono text-[11px] text-cyan-400">
                    {ISO_MESSAGES.find(m => m.id === selectedMsg)?.id} - <span className="text-gray-300">{ISO_MESSAGES.find(m => m.id === selectedMsg)?.name}</span>
                  </span>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-[#12121a] border border-gray-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 border-b border-gray-800 relative bg-[#0a0a0f]">
                      <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search schema (e.g. pacs.008 or CreditTransfer)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-gray-700 rounded py-1 pl-8 pr-2 text-xs text-gray-200 focus:border-blue-500 focus:outline-none placeholder:text-gray-600 font-mono"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {filteredMessages.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-500">No matching schemas found</div>
                      ) : (
                        filteredMessages.map(m => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedMsg(m.id);
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className={`p-2 px-3 text-xs cursor-pointer hover:bg-blue-500/10 hover:text-blue-400 transition-colors border-l-2 ${selectedMsg === m.id ? 'border-blue-500 bg-blue-500/5 text-blue-400' : 'border-transparent text-gray-300'
                              }`}
                          >
                            <div className="font-mono text-cyan-500 font-medium">{m.id}</div>
                            <div className="text-[10px] text-gray-500 truncate">{m.name}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 text-[10px] text-gray-400 flex items-center justify-between">
                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono">
                  {ISO_MESSAGES.find(m => m.id === selectedMsg)?.type}
                </span>
                {schema && (
                  <span className={schema.parsedFromRealXSD ? "text-green-400" : "text-yellow-400"}>
                    {schema.parsedFromRealXSD ? "✅ Real XSD Loaded" : "⚠️ Dynamic Simulation"}
                  </span>
                )}
              </div>

              {/* XSD Upload Button */}
              <div className="mt-4">
                <label className="flex items-center justify-center w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold py-2 px-4 rounded cursor-pointer transition-colors shadow-lg shadow-cyan-500/5">
                  <FileCode2 size={14} className="mr-2" />
                  Upload Custom XSD File
                  <input
                    type="file"
                    accept=".xsd,.xml"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = (evt) => parseAndApplyXSD(evt.target.result, file.name);
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Banking Intelligence Module */}
              <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-lg p-3 mt-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl"></div>
                <h3 className="text-[10px] text-cyan-400 uppercase tracking-widest mb-3 flex items-center font-bold">
                  <ShieldAlert size={12} className="mr-1.5" />
                  Banking Intelligence
                </h3>

                <div className="space-y-3 relative z-10">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Card Vault Integration</label>
                    <select
                      onChange={(e) => handleCardSelection(e.target.value)}
                      className="w-full bg-black/40 border border-cyan-500/30 rounded px-2 py-1.5 text-[10px] text-cyan-400 font-mono focus:outline-none focus:border-cyan-500 transition-all appearance-none"
                    >
                      <option value="">-- Inject Card from Vault --</option>
                      {vaultCards.map(c => (
                        <option key={c.id || c.pan} value={c.pan} className="bg-[#0d0d14]">
                          {c.network} - {c.pan.slice(-4)} ({c.issuer_name || 'Local'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">UETR (gpi Tracking)</label>
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        value={bankingData.uetr}
                        readOnly
                        className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[10px] text-cyan-200 font-mono focus:outline-none"
                      />
                      <button
                        onClick={generateUETR}
                        title="Regenerate UETR"
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 p-1.5 rounded border border-cyan-500/30 transition-colors"
                      >
                        <Zap size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Sender BIC</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={bankingData.senderBic}
                          onChange={e => handleBankingChange('senderBic', e.target.value.toUpperCase())}
                          className={`w-full bg-black/40 border rounded px-2 py-1.5 text-[10px] font-mono focus:outline-none ${isValidBIC(bankingData.senderBic) ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}
                        />
                        <div className={`absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${isValidBIC(bankingData.senderBic) ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Receiver BIC</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={bankingData.receiverBic}
                          onChange={e => handleBankingChange('receiverBic', e.target.value.toUpperCase())}
                          className={`w-full bg-black/40 border rounded px-2 py-1.5 text-[10px] font-mono focus:outline-none ${isValidBIC(bankingData.receiverBic) ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}
                        />
                        <div className={`absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${isValidBIC(bankingData.receiverBic) ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Charge Bearer (Fee Engine)</label>
                    <select
                      value={bankingData.chargeBearer}
                      onChange={e => handleBankingChange('chargeBearer', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[10px] text-gray-200 focus:outline-none focus:border-cyan-500 transition-all"
                    >
                      <option value="SHA">SHA (Shared Fees)</option>
                      <option value="OUR">OUR (Sender Pays All)</option>
                      <option value="BEN">BEN (Receiver Pays All)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Network Configuration Widget */}
              <div className="border border-white/10 bg-black/40 rounded-lg p-3 mt-4">
                <h3 className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                  <Activity size={12} className="mr-1.5 text-cyan-500" />
                  Network Target
                </h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tcpConfig.host}
                    onChange={e => setTcpConfig({ ...tcpConfig, host: e.target.value })}
                    placeholder="127.0.0.1"
                    className="flex-1 bg-[#0d0d12] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none placeholder:text-gray-600"
                  />
                  <input
                    type="text"
                    value={tcpConfig.port}
                    onChange={e => setTcpConfig({ ...tcpConfig, port: e.target.value })}
                    placeholder="8583"
                    className="w-20 bg-[#0d0d12] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none placeholder:text-gray-600"
                  />
                </div>
                <div className="mt-2 flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tcpConfig.useTLS}
                      onChange={e => setTcpConfig({ ...tcpConfig, useTLS: e.target.checked })}
                      className="rounded border-gray-600 text-cyan-500 focus:ring-cyan-500/50 bg-[#0d0d12]"
                    />
                    <span className="text-xs text-gray-400 hover:text-gray-300">Use Secure TLS</span>
                  </label>
                </div>
              </div>

            </div>
          </div>

          <div className="glass-panel rounded-xl border border-white/5 overflow-y-auto shadow-2xl flex-1 custom-scrollbar">
            <div className="p-4 border-b border-white/5 bg-black/20 sticky top-0 z-10">
              <h2 className="text-sm font-semibold text-gray-200 flex items-center">
                <FileJson size={16} className="mr-2 text-cyan-400" />
                Dynamic Transaction Parameters
              </h2>
            </div>

            {isLoadingSchema ? (
              <div className="p-8 text-center text-xs text-cyan-400 animate-pulse">
                Parsing XSD Schema for {selectedMsg}...
              </div>
            ) : schema && schema.elements ? (
              <div className="p-4 space-y-5">
                {schema.elements.map(el => (
                  <div key={el.name} className="border border-white/5 bg-black/20 rounded-lg p-3 hover:border-white/10 transition-colors">
                    <h3 className="text-[11px] font-semibold text-gray-300 mb-3 flex justify-between items-center">
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                        {el.description || el.name}
                      </span>
                      {el.required && <span className="text-red-400/80 text-[8px] uppercase tracking-wider bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20">Required</span>}
                    </h3>

                    {el.type === 'complex' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-3 border-l border-blue-500/20 ml-1.5">
                        {el.subElements.map(sub => (
                          <div key={sub.name}>
                            <label className="text-[9px] text-gray-500 uppercase tracking-wide block mb-1.5">
                              {sub.description || sub.name} {sub.required && <span className="text-red-400">*</span>}
                            </label>
                            {sub.type === 'enum' ? (
                              <select
                                value={dynamicData[el.name]?.[sub.name] || ''}
                                onChange={e => handleDynamicChange(el.name, sub.name, e.target.value)}
                                className="w-full bg-[#0d0d12] border border-white/10 rounded-md py-1.5 px-2.5 text-xs text-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all duration-200 hover:bg-[#151520]"
                              >
                                <option value="">Select Option...</option>
                                {sub.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input
                                value={dynamicData[el.name]?.[sub.name] || ''}
                                onChange={e => handleDynamicChange(el.name, sub.name, e.target.value)}
                                placeholder={`Enter ${sub.type}...`}
                                className="w-full bg-[#0d0d12] border border-white/10 rounded-md py-1.5 px-2.5 text-xs text-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all duration-200 hover:bg-[#151520] placeholder:text-gray-600"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : el.type === 'enum' ? (
                      <div className="pl-3 ml-1.5">
                        <select
                          value={dynamicData[el.name] || ''}
                          onChange={e => handleDynamicChange(el.name, null, e.target.value)}
                          className="w-full bg-[#0d0d12] border border-white/10 rounded-md py-1.5 px-2.5 text-xs text-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all duration-200 hover:bg-[#151520]"
                        >
                          <option value="">Select Option...</option>
                          {el.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="pl-3 ml-1.5">
                        <input
                          value={dynamicData[el.name] || ''}
                          onChange={e => handleDynamicChange(el.name, null, e.target.value)}
                          placeholder={`Enter ${el.type}...`}
                          className="w-full bg-[#0d0d12] border border-white/10 rounded-md py-1.5 px-2.5 text-xs text-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all duration-200 hover:bg-[#151520] placeholder:text-gray-600"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-red-400">Failed to load schema</div>
            )}
          </div>
        </div>

        {/* Right: XML Output */}
        <div className="flex-1 glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl relative flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"></div>

          <div className="p-4 border-b border-white/5 bg-black/20 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex bg-[#0a0a0f] rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setOutputMode('xml')}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center transition-all ${outputMode === 'xml' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <FileCode2 size={14} className="mr-2" /> 20022 XML
                </button>
                <button
                  onClick={() => setOutputMode('8583')}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center transition-all ${outputMode === '8583' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <ArrowLeftRight size={14} className="mr-2" /> CBPR+ 8583 Bridge
                </button>
              </div>

              {outputMode === 'xml' && (
                <label className="flex items-center space-x-2 cursor-pointer border-l border-white/10 pl-4">
                  <input
                    type="checkbox"
                    checked={wrapAppHdr}
                    onChange={e => setWrapAppHdr(e.target.checked)}
                    className="rounded border-gray-600 text-teal-500 focus:ring-teal-500/50 bg-[#0d0d12]"
                  />
                  <span className="text-xs text-gray-400 hover:text-gray-300">Wrap with Business App Header (head.001)</span>
                </label>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10"
              >
                {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy XML'}</span>
              </button>
              <button
                onClick={downloadXml}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors border border-blue-500/30"
              >
                <Download size={14} />
                <span>Download</span>
              </button>
              <button
                onClick={transmitXml}
                disabled={isTransmitting || generatedXml.includes('[REQUIRED]') || !schema || isLoadingSchema}
                className={`flex items-center space-x-1 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${(isTransmitting || !schema || isLoadingSchema)
                  ? 'bg-cyan-500/50 text-cyan-200 cursor-not-allowed'
                  : generatedXml.includes('[REQUIRED]')
                    ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20'
                  }`}
              >
                {isTransmitting ? <Activity size={14} className="animate-spin" /> : <Send size={14} />}
                <span>{isTransmitting ? 'Sending...' : 'Transmit'}</span>
              </button>
            </div>
          </div>

          {/* Validation Warning Banner */}
          {generatedXml.includes('[REQUIRED]') && (
            <div className="bg-red-500/10 border-b border-red-500/20 p-2 flex justify-center items-center">
              <span className="text-xs text-red-400 font-semibold flex items-center">
                ⚠️ Schema Validation Failed: Please fill out all [REQUIRED] fields before transmitting.
              </span>
            </div>
          )}

          <div className="flex-1 bg-[#050508] border border-gray-800 rounded-lg p-4 overflow-y-auto font-mono text-sm shadow-inner custom-scrollbar relative">
            {outputMode === 'xml' ? (
              <pre className="text-gray-300 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightXML(generatedXml) }} />
            ) : (
              <div className="space-y-6">
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">ISO 8583 Translation Active</div>
                    <div className="text-[9px] text-gray-500 mt-1">Protocol: CBPR+ / ISO 20022 Mapping v1.2</div>
                  </div>
                  <ArrowLeftRight size={20} className="text-cyan-500 animate-pulse" />
                </div>

                <pre className="text-gray-300 text-xs leading-relaxed bg-black/40 p-4 rounded-lg border border-white/5">
                  {JSON.stringify(translated8583, null, 2)}
                </pre>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Mapping Heuristics</h3>
                  {bridgeMetadata.map((m, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center justify-between group hover:bg-white/10 transition-colors">
                      <div className="flex-1">
                        <div className="text-[10px] text-cyan-400 font-mono">{m.xml}</div>
                        <div className="text-[8px] text-gray-500 mt-1">{m.reason}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="h-px w-8 bg-gray-700"></div>
                        <div className="text-[10px] font-bold text-white bg-purple-500/20 px-2 py-1 rounded border border-purple-500/30">{m.iso}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Server Response Panel */}
          {serverResponse && (
            <div className="mt-4 p-3 bg-black/40 border border-cyan-500/30 rounded-lg animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold mb-2 flex items-center">
                <Activity size={12} className="mr-1.5" />
                Network Response
              </h3>
              <pre className="text-[10px] font-mono text-gray-400 whitespace-pre-wrap break-all">
                {serverResponse}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ISO20022BuilderScreen;
