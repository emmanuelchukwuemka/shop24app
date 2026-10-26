Temu-Style Variation Selector — Full Implementation Guide

Goal: Make the Shop24 product page variation (color/size/etc) UX match Temu (temu.com/ng). Apply to both the React Native mobile app AND the Laravel web store.

Project Structure
Mobile App (Expo/React Native):
  C:\Users\USER\Desktop\shop24app\
    src\screens\ProductDetailScreen.js   ← MAIN FILE (1532 lines, partially edited)
    src\styles\theme.js                  ← COLORS, SPACING, FONTS
    src\services\api.js
    src\components\FallbackImage.js
    src\components\Toast.js
Backend / Web (Laravel, XAMPP):
  C:\xampp\htdocs\shop24\
    resources\views\products\show.blade.php  ← Product page view (1022 lines)
    public\js\app.js                         ← Frontend JS (1693 lines)
    routes\web.php                           ← API routes (line 226+)
Temu UI Features to Implement (User Confirmed All)
Bottom Sheet Modal — slides up from bottom; shows product image + name + price header, then all variant dimensions, then quantity stepper, then "Add to Cart" / "Buy Now" buttons
Dynamic Variant Preview Row — on the main product page (not inside the sheet), show a tappable row that says "Select: Color, Size" → tap opens the bottom sheet
Auto-syncing hero gallery — picking a color swatch in the sheet immediately swaps the main product image (already partially working)
Quantity stepper inside the variation selector sheet
Disabled/crossed chips for out-of-stock combos
Live price update inside the sheet header when a variant is selected
Mobile App — Changes to ProductDetailScreen.js
State additions (line ~72, ALREADY ADDED)
js
const [variantSheetVisible, setVariantSheetVisible] = useState(false);
const [sheetAction, setSheetAction] = useState('select'); // 'cart' | 'buy' | 'select'
Handler additions (line ~218, ALREADY ADDED)
js
const hasMultipleOptions = dimensionsWithOptions.some((d) => d.options.length > 1);
const handleSheetConfirm = (action) => {
  if (outOfStock) return;
  if (action === 'buy' || sheetAction === 'buy') {
    handleBuyNow();
    setVariantSheetVisible(false);
  } else {
    handleAddToCart();
    setVariantSheetVisible(false);
  }
};
const onAddToCartPress = () => {
  if (hasMultipleOptions) {
    setSheetAction('cart');
    setVariantSheetVisible(true);
  } else {
    handleAddToCart();
  }
};
const onBuyNowPress = () => {
  if (hasMultipleOptions) {
    setSheetAction('buy');
    setVariantSheetVisible(true);
  } else {
    handleBuyNow();
  }
};
Variant Section — Replace current inline picker rows with a Temu-style trigger row

Find this block (around line 471–498):

jsx
{/* Variant Picker — Color, Size, Style, Material, and Storage/Capacity are
    independent rows, each only shown when the product actually uses that
    dimension (most products use only a couple of these). A chip is disabled
    when there's no in-stock combination reachable from it given what's
    already selected in the other rows — never guessed or substituted. */}
{dimensionsWithOptions.map(({ key, label, options, selected, onSelect }) => {
  // Hide the whole row unless there's more than one value to actually
  // choose between — a single value (e.g. every product's auto-created
  // "Default"/"Standard" placeholder) isn't a real choice.
  if (options.length <= 1) return null;
  return (
    <View key={key} style={styles.variantSection}>
      <Text style={styles.variantLabel}>{label}{selected ? `: ${selected}` : ''}</Text>
      <View style={styles.variantChipsRow}>
        {options.map((value) => {
          const isSelected = selected === value;
          const isAvailable = isOptionAvailable(key, value);
          const swatchImage = key === 'color' ? colorImages[value] : null;
          if (swatchImage) {
            return (
              <TouchableOpacity
                key={value}
                style={styles.variantSwatchChip}
                onPress={() => onSelect(value)}
                disabled={!isAvailable}
              >
                <Image
                  source={{ uri: swatchImage }}
                  style={[
                    styles.variantSwatchThumb,
                    isSelected && styles.variantSwatchThumbSelected,
                    !isAvailable && styles.variantSwatchThumbDisabled,
                  ]}
                  contentFit="cover"
                />
                <Text
                  style={[styles.variantSwatchLabel, isSelected && styles.variantChipTextSelected]}
                  numberOfLines={1}
                >
                  {value}{!isAvailable ? ' (Sold out)' : ''}
                </Text>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.variantChip,
                isSelected && styles.variantChipSelected,
                !isAvailable && styles.variantChipDisabled,
              ]}
              onPress={() => onSelect(value)}
              disabled={!isAvailable}
            >
              <Text style={[styles.variantChipText, isSelected && styles.variantChipTextSelected]}>
                {value}{!isAvailable ? ' (Sold out)' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
})}

Replace it with:

jsx
{/* Temu-style Variant Trigger Row — tapping opens the bottom sheet */}
{hasMultipleOptions && (
  <TouchableOpacity
    style={styles.variantTriggerRow}
    onPress={() => { setSheetAction('select'); setVariantSheetVisible(true); }}
    activeOpacity={0.7}
  >
    <View style={styles.variantTriggerLeft}>
      {/* Show up to 4 selected color swatches as mini thumbnail row */}
      {optionsFor('color').length > 1 && (
        <View style={styles.variantTriggerSwatches}>
          {optionsFor('color').slice(0, 4).map((c) => {
            const img = colorImages[c];
            return img ? (
              <Image
                key={c}
                source={{ uri: img }}
                style={[
                  styles.variantTriggerSwatchThumb,
                  selectedColor === c && styles.variantTriggerSwatchSelected,
                ]}
                contentFit="cover"
              />
            ) : (
              <View key={c} style={[
                styles.variantTriggerSwatchCircle,
                selectedColor === c && styles.variantTriggerSwatchSelected,
              ]} />
            );
          })}
          {optionsFor('color').length > 4 && (
            <Text style={styles.variantTriggerMore}>+{optionsFor('color').length - 4}</Text>
          )}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.variantTriggerTitle}>
          {dimensionsWithOptions
            .filter((d) => d.options.length > 1)
            .map((d) => d.selected ? `${d.label}: ${d.selected}` : d.label)
            .join('  ·  ')}
        </Text>
        <Text style={styles.variantTriggerSub}>
          {selectedVariant ? `${selectedVariant.stock > 0 ? `${selectedVariant.stock} in stock` : 'Sold out'}` : 'Tap to select options'}
        </Text>
      </View>
    </View>
    <ChevronRight size={18} color={COLORS.textLight} />
  </TouchableOpacity>
)}
SKU line (keep as-is, right after the trigger row)
jsx
{!!selectedVariant?.sku && (
  <Text style={styles.skuText}>SKU: {selectedVariant.sku}</Text>
)}
Bottom Sheet Modal — Insert BEFORE </View> that closes the root View (just before <Toast ...> line ~790)
jsx
{/* =================== Temu-style Variant Bottom Sheet =================== */}
<Modal
  visible={variantSheetVisible}
  animationType="slide"
  transparent
  onRequestClose={() => setVariantSheetVisible(false)}
>
  <TouchableOpacity
    style={styles.sheetOverlay}
    activeOpacity={1}
    onPress={() => setVariantSheetVisible(false)}
  />
  <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
    {/* Sheet Header — product thumbnail + price */}
    <View style={styles.sheetHeader}>
      <FallbackImage
        uri={imagesList[0]}
        style={styles.sheetHeaderImage}
        iconSize={20}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.sheetPrice}>
          ₦{discountedPrice.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          {hasDiscount && (
            <Text style={styles.sheetOldPrice}>
              {'  '}₦{product.price.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </Text>
          )}
        </Text>
        {selectedVariant && (
          <Text style={styles.sheetVariantLabel} numberOfLines={1}>
            {variantLabel}
          </Text>
        )}
        <Text style={[styles.sheetStockLabel, outOfStock && { color: COLORS.textMuted }]}>
          {outOfStock ? 'Out of Stock' : `${selectedVariant?.stock ?? ''} pieces available`}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.sheetCloseBtn}
        onPress={() => setVariantSheetVisible(false)}
      >
        <X size={20} color={COLORS.text} />
      </TouchableOpacity>
    </View>
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Variant Dimensions */}
      {dimensionsWithOptions.map(({ key, label, options, selected, onSelect }) => {
        if (options.length <= 1) return null;
        return (
          <View key={key} style={styles.sheetDimSection}>
            <Text style={styles.sheetDimLabel}>
              {label}
              {selected ? `: ` : ''}
              {selected && <Text style={{ color: COLORS.primary }}>{selected}</Text>}
            </Text>
            <View style={styles.sheetChipsRow}>
              {options.map((value) => {
                const isSelected = selected === value;
                const isAvailable = isOptionAvailable(key, value);
                const swatchImage = key === 'color' ? colorImages[value] : null;
                if (swatchImage) {
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.sheetSwatchBtn,
                        !isAvailable && styles.sheetChipDisabled,
                      ]}
                      onPress={() => onSelect(value)}
                      disabled={!isAvailable}
                    >
                      <View style={[
                        styles.sheetSwatchThumbWrap,
                        isSelected && styles.sheetSwatchThumbSelected,
                      ]}>
                        <Image
                          source={{ uri: swatchImage }}
                          style={styles.sheetSwatchThumb}
                          contentFit="cover"
                        />
                        {isSelected && (
                          <View style={styles.sheetSwatchCheckBadge}>
                            <Check size={9} color="#fff" strokeWidth={3} />
                          </View>
                        )}
                        {!isAvailable && <View style={styles.sheetChipStrike} />}
                      </View>
                      <Text
                        style={[styles.sheetSwatchLabel, isSelected && { color: COLORS.primary, fontWeight: '600' }]}
                        numberOfLines={1}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.sheetChip,
                      isSelected && styles.sheetChipSelected,
                      !isAvailable && styles.sheetChipDisabled,
                    ]}
                    onPress={() => onSelect(value)}
                    disabled={!isAvailable}
                  >
                    {isSelected && <View style={styles.sheetChipCheckCorner}><Check size={8} color="#fff" strokeWidth={3} /></View>}
                    <Text style={[styles.sheetChipText, isSelected && styles.sheetChipTextSelected]}>
                      {value}
                    </Text>
                    {!isAvailable && <View style={styles.sheetChipStrike} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
      {/* Quantity Stepper */}
      <View style={styles.sheetQtyRow}>
        <Text style={styles.sheetDimLabel}>Quantity</Text>
        <View style={styles.sheetQtyControl}>
          <TouchableOpacity
            style={styles.sheetQtyBtn}
            onPress={() => setQuantity((p) => Math.max(1, p - 1))}
          >
            <Minus size={16} color={quantity <= 1 ? COLORS.textMuted : COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.sheetQtyVal}>{quantity}</Text>
          <TouchableOpacity
            style={styles.sheetQtyBtn}
            onPress={() => setQuantity((p) => p + 1)}
          >
            <Plus size={16} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    {/* Sheet CTA Buttons */}
    <View style={styles.sheetFooter}>
      <TouchableOpacity
        style={[styles.sheetAddToCartBtn, outOfStock && styles.disabledBtn]}
        onPress={() => handleSheetConfirm('cart')}
        disabled={outOfStock}
        activeOpacity={0.85}
      >
        <Text style={styles.sheetAddToCartText}>
          {outOfStock ? 'Sold Out' : 'Add to Cart'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.sheetBuyNowBtn, outOfStock && styles.disabledBtn]}
        onPress={() => handleSheetConfirm('buy')}
        disabled={outOfStock}
        activeOpacity={0.85}
      >
        <Text style={styles.sheetBuyNowText}>Buy Now</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
Footer buttons — Replace handleAddToCart/handleBuyNow with onAddToCartPress/onBuyNowPress

Find around line 790:

jsx
{/* Bottom Sticky Action Bar */}
<View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
  <TouchableOpacity
    style={[styles.addToCartBtn, outOfStock && styles.disabledBtn]}
    onPress={handleAddToCart}
    ...
  >

Change onPress={handleAddToCart} → onPress={onAddToCartPress} Change onPress={handleBuyNow} → onPress={onBuyNowPress}

New Styles to Add (append to StyleSheet.create({...}))
js
// ---- Variant Trigger Row ----
variantTriggerRow: {
  backgroundColor: COLORS.white,
  paddingHorizontal: SPACING.md,
  paddingVertical: 14,
  borderBottomWidth: 8,
  borderBottomColor: '#F5F5F7',
  flexDirection: 'row',
  alignItems: 'center',
  gap: SPACING.sm,
},
variantTriggerLeft: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},
variantTriggerSwatches: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 2,
},
variantTriggerSwatchThumb: {
  width: 38,
  height: 38,
  borderRadius: 6,
  borderWidth: 1.5,
  borderColor: 'transparent',
},
variantTriggerSwatchCircle: {
  width: 24,
  height: 24,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: COLORS.border,
  backgroundColor: COLORS.border,
},
variantTriggerSwatchSelected: {
  borderColor: COLORS.primary,
},
variantTriggerMore: {
  fontSize: FONTS.size.xs,
  color: COLORS.textLight,
  marginLeft: 2,
},
variantTriggerTitle: {
  fontSize: FONTS.size.sm,
  color: COLORS.text,
  fontWeight: '600',
  marginBottom: 2,
},
variantTriggerSub: {
  fontSize: FONTS.size.xs,
  color: COLORS.textLight,
},
// ---- Bottom Sheet ----
sheetOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
},
sheetContainer: {
  backgroundColor: COLORS.white,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  maxHeight: '85%',
  minHeight: '55%',
},
sheetHeader: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  padding: SPACING.md,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.border,
  gap: SPACING.md,
},
sheetHeaderImage: {
  width: 80,
  height: 80,
  borderRadius: 8,
  backgroundColor: '#F5F5F7',
},
sheetPrice: {
  fontSize: FONTS.size.xl,
  fontWeight: 'bold',
  color: COLORS.primary,
  marginBottom: 2,
},
sheetOldPrice: {
  fontSize: FONTS.size.sm,
  color: COLORS.textMuted,
  fontWeight: 'normal',
  textDecorationLine: 'line-through',
},
sheetVariantLabel: {
  fontSize: FONTS.size.sm,
  color: COLORS.textLight,
  marginBottom: 2,
},
sheetStockLabel: {
  fontSize: FONTS.size.xs,
  color: COLORS.success,
  fontWeight: '500',
},
sheetCloseBtn: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#F5F5F7',
  justifyContent: 'center',
  alignItems: 'center',
},
sheetDimSection: {
  paddingHorizontal: SPACING.md,
  paddingTop: SPACING.md,
  paddingBottom: SPACING.sm,
  borderBottomWidth: 1,
  borderBottomColor: '#F5F5F7',
},
sheetDimLabel: {
  fontSize: FONTS.size.sm,
  fontWeight: '600',
  color: COLORS.text,
  marginBottom: SPACING.sm,
},
sheetChipsRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: SPACING.sm,
},
sheetChip: {
  borderRadius: 6,
  paddingHorizontal: SPACING.md,
  paddingVertical: 10,
  borderWidth: 1.5,
  borderColor: COLORS.border,
  backgroundColor: COLORS.white,
  position: 'relative',
  overflow: 'hidden',
},
sheetChipSelected: {
  borderColor: COLORS.primary,
  backgroundColor: 'rgba(185,28,28,0.06)',
},
sheetChipDisabled: {
  opacity: 0.45,
},
sheetChipText: {
  fontSize: FONTS.size.sm,
  color: COLORS.text,
  fontWeight: '500',
},
sheetChipTextSelected: {
  color: COLORS.primary,
  fontWeight: '700',
},
sheetChipCheckCorner: {
  position: 'absolute',
  bottom: 0,
  right: 0,
  width: 16,
  height: 16,
  backgroundColor: COLORS.primary,
  borderTopLeftRadius: 6,
  justifyContent: 'center',
  alignItems: 'center',
},
sheetChipStrike: {
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: 1.5,
  backgroundColor: COLORS.textMuted,
  transform: [{ rotate: '-20deg' }],
},
sheetSwatchBtn: {
  alignItems: 'center',
  width: 64,
  gap: 4,
},
sheetSwatchThumbWrap: {
  width: 56,
  height: 56,
  borderRadius: 8,
  borderWidth: 2,
  borderColor: 'transparent',
  overflow: 'hidden',
  position: 'relative',
},
sheetSwatchThumbSelected: {
  borderColor: COLORS.primary,
},
sheetSwatchThumb: {
  width: '100%',
  height: '100%',
},
sheetSwatchCheckBadge: {
  position: 'absolute',
  bottom: 3,
  right: 3,
  width: 16,
  height: 16,
  borderRadius: 8,
  backgroundColor: COLORS.primary,
  justifyContent: 'center',
  alignItems: 'center',
},
sheetSwatchLabel: {
  fontSize: FONTS.size.xs,
  color: COLORS.text,
  textAlign: 'center',
},
sheetQtyRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.md,
},
sheetQtyControl: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 999,
  overflow: 'hidden',
  height: 38,
},
sheetQtyBtn: {
  width: 40,
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: COLORS.white,
},
sheetQtyVal: {
  width: 36,
  textAlign: 'center',
  fontSize: FONTS.size.md,
  fontWeight: '700',
  color: COLORS.text,
  borderLeftWidth: 1,
  borderRightWidth: 1,
  borderColor: COLORS.border,
  lineHeight: 38,
},
sheetFooter: {
  flexDirection: 'row',
  gap: 10,
  paddingHorizontal: SPACING.md,
  paddingTop: SPACING.md,
  borderTopWidth: 1,
  borderTopColor: COLORS.border,
},
sheetAddToCartBtn: {
  flex: 1,
  backgroundColor: COLORS.secondary,
  borderRadius: 999,
  paddingVertical: 14,
  alignItems: 'center',
},
sheetAddToCartText: {
  color: COLORS.white,
  fontWeight: '700',
  fontSize: FONTS.size.md,
},
sheetBuyNowBtn: {
  flex: 1,
  backgroundColor: COLORS.primary,
  borderRadius: 999,
  paddingVertical: 14,
  alignItems: 'center',
},
sheetBuyNowText: {
  color: COLORS.white,
  fontWeight: '700',
  fontSize: FONTS.size.md,
},
Web Store — Changes to show.blade.php
What to change

The current web code already has inline chips (color swatches, size buttons) + a working JS variant picker in app.js. The goal is to upgrade it to a Temu-style bottom sheet on mobile (≤640px) while keeping the desktop inline layout.

1. Add the Bottom Sheet HTML (insert just before <!-- Lightbox Modal --> at ~line 635)
html
<!-- ===== Temu-style Variant Sheet (mobile only) ===== -->
<div id="variant-sheet-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9990;" onclick="closeVariantSheet()"></div>
<div id="variant-sheet" style="display:none; position:fixed; bottom:0; left:0; right:0; background:#fff; border-radius:16px 16px 0 0; z-index:9991; max-height:85vh; flex-direction:column; overflow:hidden;">
  <!-- Sheet Header -->
  <div id="vsheet-header" style="display:flex; align-items:flex-start; gap:14px; padding:16px; border-bottom:1px solid #f0f0f0;">
    <img id="vsheet-img" src="" alt="" style="width:80px; height:80px; border-radius:8px; object-fit:cover; background:#f5f5f5;">
    <div style="flex:1; min-width:0;">
      <div id="vsheet-price" style="font-size:20px; font-weight:700; color:#ef4444; margin-bottom:2px;"></div>
      <div id="vsheet-variant-label" style="font-size:12px; color:#888; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"></div>
      <div id="vsheet-stock-label" style="font-size:11px; color:#10b981; font-weight:500;"></div>
    </div>
    <button onclick="closeVariantSheet()" style="width:32px; height:32px; border-radius:50%; border:none; background:#f5f5f5; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:18px; color:#333; flex-shrink:0;">✕</button>
  </div>
  <!-- Sheet Scrollable Body -->
  <div style="flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch;">
    <!-- Variant groups are cloned into here by JS -->
    <div id="vsheet-variants"></div>
    <!-- Quantity -->
    <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-top:1px solid #f5f5f5;">
      <span style="font-size:14px; font-weight:600; color:#111;">Quantity</span>
      <div style="display:flex; align-items:center; border:1px solid #e5e5e5; border-radius:999px; overflow:hidden; height:36px;">
        <button id="vsheet-qty-minus" onclick="vsheetQty(-1)" style="width:38px; height:100%; border:none; background:#fff; font-size:20px; font-weight:bold; cursor:pointer; color:#111;">−</button>
        <span id="vsheet-qty-val" style="width:34px; text-align:center; font-size:15px; font-weight:700; border-left:1px solid #e5e5e5; border-right:1px solid #e5e5e5; line-height:36px;">1</span>
        <button id="vsheet-qty-plus" onclick="vsheetQty(1)" style="width:38px; height:100%; border:none; background:#fff; font-size:20px; font-weight:bold; cursor:pointer; color:#111;">+</button>
      </div>
    </div>
  </div>
  <!-- Sheet Footer CTA -->
  <div id="vsheet-footer" style="display:flex; gap:10px; padding:14px 16px 24px; border-top:1px solid #f0f0f0;">
    <button id="vsheet-add-cart-btn" onclick="vsheetConfirm(false)" style="flex:1; padding:14px; background:#111; color:#fff; border:none; border-radius:999px; font-size:15px; font-weight:700; cursor:pointer;">Add to Cart</button>
    <button id="vsheet-buy-now-btn" onclick="vsheetConfirm(true)" style="flex:1; padding:14px; background:#ef4444; color:#fff; border:none; border-radius:999px; font-size:15px; font-weight:700; cursor:pointer;">Buy Now</button>
  </div>
</div>
2. Replace the Mobile Sticky Bar onclick handlers

In the mobile sticky bar (near line 977–978):

html
<button type="button" id="sticky-buy-now-btn" ...>Buy Now</button>
<button type="button" id="sticky-add-to-cart-btn" ...>Add to Cart</button>

Change their onclick to open the sheet:

html
<button type="button" id="sticky-buy-now-btn" onclick="openVariantSheet('buy')" ...>Buy Now</button>
<button type="button" id="sticky-add-to-cart-btn" onclick="openVariantSheet('cart')" ...>Add to Cart</button>

And remove the existing JS that just delegates clicks to the hidden real buttons.

3. Add Sheet JS (at bottom of page, before @endsection)
html
<script>
var _vsheetAction = 'cart';
var _vsheetQty = 1;
function openVariantSheet(action) {
  _vsheetAction = action || 'cart';
  _vsheetQty = parseInt(document.getElementById('purchase-qty')?.value) || 1;
  document.getElementById('vsheet-qty-val').textContent = _vsheetQty;
  // Sync header image + price + stock
  var mainImg = document.getElementById('gallery-main-image');
  var priceEl = document.getElementById('display-price');
  document.getElementById('vsheet-img').src = mainImg ? mainImg.src : '';
  document.getElementById('vsheet-price').textContent = priceEl ? priceEl.textContent : '';
  var stockEl = document.getElementById('variant-stock-display');
  var stockNum = stockEl ? parseInt(stockEl.textContent) : 0;
  var stockLabel = document.getElementById('vsheet-stock-label');
  stockLabel.textContent = stockNum > 0 ? stockNum + ' pieces available' : 'Out of Stock';
  stockLabel.style.color = stockNum > 0 ? '#10b981' : '#9ca3af';
  // Clone variant groups into sheet
  var sheetVariants = document.getElementById('vsheet-variants');
  sheetVariants.innerHTML = '';
  document.querySelectorAll('.variant-group').forEach(function(group) {
    var clone = group.cloneNode(true);
    clone.style.cssText = 'padding:14px 16px; border-bottom:1px solid #f5f5f5;';
    // Re-wire click handlers on cloned chips
    clone.querySelectorAll('.variant-chip-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (this.classList.contains('disabled')) return;
        // Sync click back to real group
        var type = group.getAttribute('data-variant-type');
        var val = this.getAttribute('data-value');
        var realBtn = group.querySelector('.variant-chip-btn[data-value="' + val + '"]');
        if (realBtn && !realBtn.classList.contains('disabled')) realBtn.click();
        // Update active state in clone
        clone.querySelectorAll('.variant-chip-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        // Re-sync sheet header
        setTimeout(function() {
          var priceEl2 = document.getElementById('display-price');
          document.getElementById('vsheet-price').textContent = priceEl2 ? priceEl2.textContent : '';
          var sEl = document.getElementById('variant-stock-display');
          var n = sEl ? parseInt(sEl.textContent) : 0;
          document.getElementById('vsheet-stock-label').textContent = n > 0 ? n + ' pieces available' : 'Out of Stock';
          // Update variant label
          var parts = [];
          document.querySelectorAll('.variant-group').forEach(function(g) {
            var active = g.querySelector('.variant-chip-btn.active');
            if (active) parts.push(active.getAttribute('data-value'));
          });
          document.getElementById('vsheet-variant-label').textContent = parts.join(' / ');
          // Sync main image to sheet
          var mi = document.getElementById('gallery-main-image');
          if (mi) document.getElementById('vsheet-img').src = mi.src;
        }, 50);
      });
    });
    sheetVariants.appendChild(clone);
  });
  // Sync current variant label
  var parts = [];
  document.querySelectorAll('.variant-group').forEach(function(g) {
    var active = g.querySelector('.variant-chip-btn.active');
    if (active) parts.push(active.getAttribute('data-value'));
  });
  document.getElementById('vsheet-variant-label').textContent = parts.join(' / ');
  document.getElementById('variant-sheet-overlay').style.display = 'block';
  var sheet = document.getElementById('variant-sheet');
  sheet.style.display = 'flex';
  sheet.style.flexDirection = 'column';
  document.body.style.overflow = 'hidden';
}
function closeVariantSheet() {
  document.getElementById('variant-sheet-overlay').style.display = 'none';
  document.getElementById('variant-sheet').style.display = 'none';
  document.body.style.overflow = '';
}
function vsheetQty(delta) {
  _vsheetQty = Math.max(1, _vsheetQty + delta);
  document.getElementById('vsheet-qty-val').textContent = _vsheetQty;
  var realQty = document.getElementById('purchase-qty');
  if (realQty) realQty.value = _vsheetQty;
}
function vsheetConfirm(redirect) {
  var realQty = document.getElementById('purchase-qty');
  if (realQty) realQty.value = _vsheetQty;
  closeVariantSheet();
  if (redirect) {
    var buyBtn = document.getElementById('buy-now-btn');
    if (buyBtn) buyBtn.click();
  } else {
    var cartBtn = document.getElementById('add-to-cart-btn');
    if (cartBtn) cartBtn.click();
  }
}
</script>
<style>
/* Sheet slide-up animation */
#variant-sheet {
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.32,0,0.67,0);
}
#variant-sheet.open {
  transform: translateY(0);
}
/* Mobile-only: hide the sheet trigger on desktop */
@media (min-width: 641px) {
  #variant-sheet, #variant-sheet-overlay { display: none !important; }
}
/* Swatch chips in sheet: keep same .variant-chip-btn styles already in temu-style-panel */
</style>

Note on CSS animation: You also need to add JS to toggle the .open class for the slide animation to work. In openVariantSheet(), after setting display:flex, add:

js
requestAnimationFrame(function() { sheet.classList.add('open'); });

And in closeVariantSheet():

js
sheet.classList.remove('open');
setTimeout(function() { sheet.style.display = 'none'; }, 300);
Summary of All Files Changed
File	Change
ProductDetailScreen.js	Add variantSheetVisible + sheetAction state; add hasMultipleOptions, onAddToCartPress, onBuyNowPress, handleSheetConfirm handlers; replace inline variant rows with trigger row; add <Modal> bottom sheet JSX; add all new sheet styles to StyleSheet; update footer button handlers
show.blade.php	Add bottom-sheet HTML before lightbox modal; update mobile sticky bar buttons to call openVariantSheet(); add sheet JS + CSS at bottom
Current Progress (last verified 2026-10-23)
Mobile App (ProductDetailScreen.js) — STATUS: DONE
✅ Imports updated (ChevronRight, Check, X, Minus, Plus added from lucide-react-native)
✅ variantSheetVisible state added (~line 72)
✅ hasMultipleOptions, onAddToCartPress, onBuyNowPress, handleSheetConfirm handlers added (~line 218)
✅ Inline variant picker rows replaced with trigger row (~line 460)
✅ Bottom Sheet Modal inserted (~line 786), reusing dimensionsWithOptions/isOptionAvailable/colorImages directly — no DOM cloning, so the sheet's chip availability and swatch images always match the main page by construction
✅ New styles added to StyleSheet
✅ Footer button handlers updated to onAddToCartPress/onBuyNowPress
Web Store (show.blade.php) — STATUS: DONE
✅ Bottom sheet HTML added (~line 1012)
✅ Mobile sticky bar updated to call openVariantSheet('buy' | 'cart')
✅ Sheet JS added (window.openVariantSheet/closeVariantSheet/vsheetQty/vsheetConfirm, ~line 1058)
✅ Original inline variant-group chip rows hidden on mobile (≤640px) so they don't show twice alongside the sheet trigger
✅ Desktop safety-hide added for #variant-sheet/#variant-sheet-overlay (@media min-width:641px)

Verification (2026-10-23)
Web was verified end-to-end with a real headless-browser run (Playwright) against the local XAMPP site — not just a code read — covering: sheet open/close, live price/image/stock sync on variant change, disabled/out-of-stock chip state, and the desktop-vs-mobile split. Two real bugs were found this way and fixed:
  1. Sheet chips didn't re-sync their disabled/out-of-stock state after a selection changed elsewhere in the sheet (e.g. picking a color could leave an now-unavailable size still selectable). Fixed by re-syncing every cloned chip's .disabled class after each selection.
  2. Color swatch images never rendered inside the sheet — the swatch CSS was scoped to .temu-style-panel, but the sheet's cloned chips live outside that container. Fixed by adding an unscoped copy of the swatch rules to public/css/app.css.
App could not be verified via a live emulator/device in this environment, so it got an extra-careful logic read instead of just a presence check. That caught a real bug: handleSheetConfirm used `action === 'buy' || sheetAction === 'buy'`, where sheetAction was set once when the sheet opened and never changed — so opening the sheet via the footer's Buy Now (sheetAction='buy'), then tapping the sheet's own Add to Cart button (action='cart'), still ran Buy Now and redirected to the cart tab instead of just adding to cart. Fixed by making handleSheetConfirm trust only the explicit `action` passed by whichever button was actually tapped; sheetAction was then dead state (set 3 places, read nowhere) and was removed entirely.
Still recommended: an actual on-device/Expo Go pass on the app, since no amount of static reading replaces real interaction — flag this to whoever does that pass.

Not done: deployment. Both sides are implemented and locally verified but not yet pushed to myshop24.ng (SSH deploy credentials are broken — see earlier deploy notes; manual zip re-upload via cPanel is the current workaround).