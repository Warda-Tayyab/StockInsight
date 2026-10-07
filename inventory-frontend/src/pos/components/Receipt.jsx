import { HiOutlinePrinter, HiOutlineX } from 'react-icons/hi';
import Barcode from 'react-barcode';
import { printReceipt } from "../utils/printReceipt";
import { useAuthContext } from '../../shared/context/AuthContext';
import { getTenantDisplayName } from '../../shared/utils/tenantBrand';

const Receipt = ({ sale = {}, onClose, onPrint }) => {
  const { user } = useAuthContext();
  const tenantName = getTenantDisplayName(user);
  const receipt = sale.receipt || {};

  const {
    receiptMessage = '',
    returnWindow = 30,
    exchangeWindow = 30,
    returnsEnabled = true,
    exchangesEnabled = true,
    policyNotes = '',
    taxLabel = 'Tax',
    storeDiscountLabel = '',
    storeDiscountAmount = 0,
    couponCode = '',
    couponLabel = '',
    couponDiscountAmount = 0,
    discountTotal = 0,
    workingHours = '11:00 AM - 11:00 PM',
    workingHoursFriday = '3:00 PM - 11:00 PM',
    receiptFooterMessage = '',
    developedBy = tenantName,
  } = receipt;

  const {
    items = [],
    subtotal = 0,
    tax = 0,
    total = 0,
    paymentMethod = '',
    cashReceived = 0,
    changeReturned = 0,
    createdAt,
    invoiceId,
    storeDiscountAmount: saleStoreDiscountAmount = 0,
    couponCode: saleCouponCode = '',
    couponDiscountAmount: saleCouponDiscountAmount = 0,
    discountTotal: saleDiscountTotal = 0,
  } = sale;

  const resolvedStoreDiscountAmount =
    storeDiscountAmount || saleStoreDiscountAmount || 0;

  const resolvedCouponCode =
    couponCode || saleCouponCode || '';

  const resolvedCouponDiscountAmount =
    couponDiscountAmount || saleCouponDiscountAmount || 0;

  const resolvedDiscountTotal =
    discountTotal || saleDiscountTotal || 0;

  const date = createdAt
    ? new Date(createdAt).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div
      className="modal-overlay z-[9999]"
      onClick={onClose}
    >
      <div
        className="modal-content max-w-sm flex flex-col max-h-[90vh] font-mono"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold m-0">
            RECEIPT
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="btn-icon !border-slate-700 !bg-slate-800 !text-white hover:!bg-slate-700 hover:!text-white"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div
          id="receipt-print-area"
          className="receipt p-4 text-sm"
        >

          {/* STORE INFO */}
          <div className="text-center mb-3">

            <h2 className="text-lg font-bold">
              {receipt.companyName}
            </h2>

            {receipt.location && (
              <p>{receipt.location}</p>
            )}

            {receipt.phone && (
              <p>{receipt.phone}</p>
            )}

          </div>

          <div className="bg-black text-white text-center py-1 font-bold text-sm mb-3">
            SALES RECEIPT
          </div>

          {/* META INFO */}
          <div className="text-xs text-slate-600 mb-4 space-y-1">

            <p>
              Date: {date}
            </p>

            <p>
              Invoice ID: {invoiceId || 'Not Available'}
            </p>

            <p>
              Payment: {paymentMethod}
            </p>

          </div>

          <div className="border-t border-dashed border-slate-300 my-3"></div>

          {/* ========================================================= */}
          {/* ITEMS TABLE */}
          {/* ========================================================= */}

          <div className="text-[10px]">

            {/* TABLE HEADER */}
            <div className="grid grid-cols-[28px_1fr_62px_52px_62px] gap-x-2 bg-black text-white px-2 py-1.5 font-bold items-center">

              <span>
                QTY
              </span>

              <span>
                PRODUCT
              </span>

              <span className="text-right">
                ORIGINAL
              </span>

              <span className="text-center">
                 DISC.
                </span>

              <span className="text-right">
                PRICE
              </span>

            </div>

            {/* TABLE ROWS */}
            {items.map((item, index) => {

              const quantity = Number(
                item.quantity || 0
              );

       
              const originalLineTotal = Number(
                item.originalLineTotal ??
                (
                  (Number(item.unitPrice) || 0) *
                  quantity
                )
              );
              
              const discountAmount = Number(
                item.discountAmount || 0
              );
              
              const discountedLineTotal = Math.max(
                Number(item.lineTotal || 0),
                0
              );
              
              const discountType = item.discountType;

              const discountValue = Number(
                item.discountValue || 0
              );
      
              return (
                <div
                  key={item.productId || index}
                  className="grid grid-cols-[28px_1fr_62px_52px_62px] gap-x-2 px-2 py-2 border-b border-dashed border-slate-200 items-center"
                >

                  {/* QTY */}
                  <span className="font-medium">
                    {quantity} ×
                  </span>

                  {/* PRODUCT */}
                  <span className="font-medium whitespace-normal break-words pr-1 leading-4">
  {item.productName}
</span>

                  {/* ORIGINAL PRICE */}
                  <span className="text-right">
                    Rs.{originalLineTotal.toFixed(2)}
                  </span>

                  {/* DISCOUNT */}
                  <span className="text-center text-emerald-700 font-semibold whitespace-nowrap">

                  {discountAmount > 0
  ? (
    discountType === 'percentage'
      ? `-${discountValue}%`
      : `-Rs.${discountValue.toFixed(2)}`
  )
  : '—'
}

                  </span>

                  {/* DISCOUNTED PRICE */}
                  <span className="text-right text-emerald-700 font-semibold">
                    Rs.{discountedLineTotal.toFixed(2)}
                  </span>

                </div>
              );
            })}

          </div>

          <div className="border-t border-dashed border-slate-300 my-3"></div>

          {/* ========================================================= */}
          {/* TOTALS */}
          {/* ========================================================= */}

          <div className="border-t border-dashed border-slate-300 mt-3 pt-3 space-y-1">

            {/* SUBTOTAL */}
            <div className="flex justify-between">
              <span>
                Subtotal
              </span>

              <span>
                Rs.{Number(subtotal).toFixed(2)}
              </span>
            </div>

           

            {/* COUPON DISCOUNT */}
            {resolvedCouponDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">

                <span>
                  {couponLabel || `Coupon (${resolvedCouponCode})`}
                </span>

                <span>
                  -Rs.{Number(resolvedCouponDiscountAmount).toFixed(2)}
                </span>

              </div>
            )}

          
            {/* TAX */}
            <div className="flex justify-between">

              <span>
                {taxLabel}
              </span>

              <span>
                Rs.{Number(tax).toFixed(2)}
              </span>

            </div>

            {/* CASH RECEIVED */}
            <div className="flex justify-between">

              <span>
                Cash Received
              </span>

              <span>
                Rs.{Number(cashReceived).toFixed(2)}
              </span>

            </div>

            {/* CHANGE RETURNED */}
            <div className="flex justify-between">

              <span>
                Change Returned
              </span>

              <span>
                Rs.{Number(changeReturned).toFixed(2)}
              </span>

            </div>

          </div>

          {/* TOTAL */}
          <div className="border-t border-slate-800 mt-3 pt-2 flex justify-between font-bold text-lg text-slate-900">

            <span>
              Total
            </span>

            <span>
              Rs.{Number(total).toFixed(2)}
            </span>

          </div>

          {/* ========================================================= */}
          {/* FOOTER */}
          {/* ========================================================= */}

          <div className="mt-5 pt-3 border-t border-dashed border-slate-300 text-[11px] leading-5 text-slate-700">

            {/* RECEIPT MESSAGE */}
            <p className="text-justify">
              {receiptMessage}
            </p>

            <p>
              Please bring this invoice for any return or exchange.
            </p>

            {/* RETURN / EXCHANGE POLICY */}
            <div className="mt-3 space-y-1">

              <p>
                <span className="font-semibold">
                  Return Policy:
                </span>{' '}

                {returnsEnabled ? (
                  <>
                    Products can be returned within{' '}
                    <strong>
                      {returnWindow} days
                    </strong>{' '}
                    from the purchase date.
                  </>
                ) : (
                  <>
                    Returns are{' '}
                    <strong>
                      not allowed.
                    </strong>
                  </>
                )}
              </p>

              <p>
                <span className="font-semibold">
                  Exchange Policy:
                </span>{' '}

                {exchangesEnabled ? (
                  <>
                    Products can be exchanged within{' '}
                    <strong>
                      {exchangeWindow} days
                    </strong>{' '}
                    from the purchase date.
                  </>
                ) : (
                  <>
                    Exchanges are{' '}
                    <strong>
                      not allowed.
                    </strong>
                  </>
                )}
              </p>

            </div>

            {/* POLICY NOTES */}
            {policyNotes && (
              <p>
                {policyNotes}
              </p>
            )}

            {/* FOOTER MESSAGE */}
            {receiptFooterMessage && (
              <p>
                {receiptFooterMessage}
              </p>
            )}

            {/* BARCODE */}
            {invoiceId && (
              <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center">

                <div className="flex justify-center overflow-hidden">

                  <Barcode
                    value={String(invoiceId)}
                    format="CODE128"
                    width={1.4}
                    height={48}
                    fontSize={11}
                    margin={0}
                    displayValue
                    background="#ffffff"
                    lineColor="#000000"
                  />

                </div>

              </div>
            )}

            {/* SHOPPING HOURS */}
            <p>
              Shopping Hours:{' '}
              {workingHours}

              {workingHoursFriday && (
                <>
                  <br />
                  Friday: {workingHoursFriday}
                </>
              )}
            </p>

            {/* TAX MESSAGE */}
            <p>
              The above amount is inclusive of all applicable taxes.
            </p>

            {/* PRINT DATE/TIME */}
            <p className="text-center">

              Print Date:{' '}
              {new Date().toLocaleDateString()}

              <br />

              Print Time:{' '}
              {new Date().toLocaleTimeString()}

            </p>

            {/* DEVELOPED BY */}
            <p className="text-center font-semibold">
              Designed & Developed by {developedBy}
            </p>

          </div>

        </div>

        {/* ========================================================= */}
        {/* ACTIONS */}
        {/* ========================================================= */}

        <div className="p-4 border-t border-slate-100 flex gap-3">

          <button
            type="button"
            onClick={() => printReceipt("receipt-print-area")}
            className="flex-1 btn-secondary"
          >
            <HiOutlinePrinter className="w-4 h-4" />
            Print
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-primary"
          >
            Done
          </button>

        </div>

      </div>
    </div>
  );
};

export default Receipt;