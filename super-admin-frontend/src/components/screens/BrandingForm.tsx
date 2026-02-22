import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { type BrandingItem, type CreateUpdateBrandingRequest } from '@/superadmin-apis/tenants/branding';

interface BrandingFormProps {
  tenantId: string;
  branding?: BrandingItem;
  onSubmit: (data: CreateUpdateBrandingRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function BrandingForm({ 
  tenantId, 
  branding, 
  onSubmit, 
  onCancel, 
  loading = false 
}: BrandingFormProps) {
  const [formData, setFormData] = useState({
    customColors: branding?.customColors ?? false,
    colors: branding?.colors ?? 'blue',
    tagline: branding?.tagline ?? '',
    description: branding?.description ?? '',
    featureHighlights: branding?.featureHighlights ?? []
  });

  const [newFeature, setNewFeature] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(branding?.url || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addFeatureHighlight = () => {
    if (newFeature.trim() && !formData.featureHighlights.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        featureHighlights: [...prev.featureHighlights, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeatureHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      featureHighlights: prev.featureHighlights.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: CreateUpdateBrandingRequest = {
      tenantId,
      customColors: formData.customColors,
      colors: formData.colors,
      tagline: formData.tagline,
      description: formData.description,
      featureHighlights: formData.featureHighlights,
      ...(selectedImage && { image: selectedImage })
    };

    await onSubmit(submitData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {branding ? 'Edit Branding' : 'Create New Branding'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Custom Colors Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Custom Colors</Label>
              <p className="text-sm text-muted-foreground">
                Enable custom color scheme for this tenant
              </p>
            </div>
            <Switch
              checked={formData.customColors}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, customColors: checked }))
              }
            />
          </div>

          {/* Color Selection */}
          {
            formData.customColors && (
                <div className="space-y-2">
            <Label htmlFor="colors">Primary Color</Label>
            <Select
              value={formData.colors}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, colors: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="lightBlue">Light Blue</SelectItem>
                <SelectItem value="darkBlue">Dark Blue</SelectItem>
                <SelectItem value="cyan">Cyan</SelectItem>
                <SelectItem value="teal">Teal</SelectItem>
                <SelectItem value="turquoise">Turquoise</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="emerald">Emerald</SelectItem>
                <SelectItem value="lime">Lime</SelectItem>
                <SelectItem value="yellow">Yellow</SelectItem>
                <SelectItem value="amber">Amber</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="deepOrange">Deep Orange</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="rose">Rose</SelectItem>
                <SelectItem value="pink">Pink</SelectItem>
                <SelectItem value="fuchsia">Fuchsia</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="deepPurple">Deep Purple</SelectItem>
                <SelectItem value="indigo">Indigo</SelectItem>
                <SelectItem value="violet">Violet</SelectItem>
                <SelectItem value="magenta">Magenta</SelectItem>
                <SelectItem value="brown">Brown</SelectItem>
                <SelectItem value="gray">Gray</SelectItem>
                <SelectItem value="coolGray">Cool Gray</SelectItem>
                <SelectItem value="warmGray">Warm Gray</SelectItem>
                <SelectItem value="slate">Slate</SelectItem>
                <SelectItem value="stone">Stone</SelectItem>
              </SelectContent>
            </Select>
          </div>
            )
          }
          

          {/* Tagline */}
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={formData.tagline}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, tagline: e.target.value }))
              }
              placeholder="Your trusted support partner"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="We provide excellent customer support services"
              rows={3}
              required
            />
          </div>

          {/* Feature Highlights */}
          <div className="space-y-2">
            <Label>Feature Highlights</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature highlight"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeatureHighlight())}
              />
              <Button 
                type="button" 
                onClick={addFeatureHighlight}
                size="icon"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.featureHighlights.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.featureHighlights.map((feature, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeatureHighlight(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Brand Logo</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imagePreview} 
                  alt="Brand logo preview" 
                  className="h-16 w-16 object-contain rounded border"
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Supported formats: JPG, PNG, GIF, WebP (max 5MB)
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (branding ? 'Update Branding' : 'Create Branding')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
